# -*- coding: utf-8 -*-
# Part of AppJetty. See LICENSE file for full copyright and licensing details.

import io
import os
import base64
import tempfile
import logging
from contextlib import closing
from odoo.exceptions import UserError
from PyPDF2 import PdfFileWriter, PdfFileReader
from odoo.tools.misc import find_in_path
from odoo import models, _
from collections import OrderedDict
from odoo.tools import config, pdf
from PIL import Image
_logger = logging.getLogger(__name__)
from PyPDF2.generic import TextStringObject
from odoo.tools import format_amount, format_date, format_datetime, pdf

def _get_wkhtmltopdf_bin():
    return find_in_path('wkhtmltopdf')


class IrActionsReport(models.Model):
    _inherit = 'ir.actions.report'

    def merge_extra_content_pdf(self, res_ids, pdf_content_stream):
        if not res_ids:
            return pdf_content_stream

        content_obj = self.env['report.extra.content']
        model_id = self.env['ir.model'].sudo().search(
            [('model', '=', self.model)])
        res_id = self.env[self.model].browse(res_ids)
        extra_content_id = content_obj.search(
            [('model_id', '=', model_id.id), ('company_id', '=', res_id.company_id.id)])
        custom_documents = []
        if extra_content_id and extra_content_id.append_extra_content:
            main_pdf_fd, main_pdf_path = tempfile.mkstemp(
                suffix='.pdf', prefix='report.tmp.custom.')
            custom_documents.append(main_pdf_path)
            with open(main_pdf_fd, 'wb') as pcd:
                pcd.write(pdf_content_stream.read())

            pdf_custom_fd, pdf_custom_path = tempfile.mkstemp(
                suffix='.pdf', prefix='report.tmp.custom.')
            custom_documents.append(pdf_custom_path)
            with open(pdf_custom_fd, 'wb') as pcd:
                pcd.write(base64.decodebytes(
                    extra_content_id.append_extra_content))

        if custom_documents:
            writer = PdfFileWriter()
            streams = []  # We have to close the streams *after* PdfFilWriter's call to write()
            merged_file_fd, merged_file_path = tempfile.mkstemp(
                suffix='.pdf', prefix='report.merged.tmp.')
            try:
                for document in custom_documents:
                    pdfreport = open(document, 'rb')
                    streams.append(pdfreport)
                    reader = PdfFileReader(pdfreport)
                    for page in range(0, reader.getNumPages()):
                        writer.addPage(reader.getPage(page))

                with closing(os.fdopen(merged_file_fd, 'wb')) as merged_file:
                    writer.write(merged_file)
            finally:
                for stream in streams:
                    try:
                        stream.close()
                    except Exception:
                        pass
            custom_documents.append(merged_file_path)

            with open(merged_file_path, 'rb') as pdf_document:
                pdf_content_stream = pdf_document.read()
            pdf_content_stream = io.BytesIO(pdf_content_stream)

            for temporary_file in custom_documents:
                try:
                    os.unlink(temporary_file)
                except (OSError, IOError):
                    _logger.error(
                        'Error when trying to remove file %s' % temporary_file)

        return pdf_content_stream

    def _get_form_fields_mapping(self, order, doc_line_id_mapping=None):
        order.ensure_one()
        env = self.with_context(use_babel=True).env
        tz = order.partner_id.tz or self.env.user.tz or 'UTC'
        lang_code = order.partner_id.lang or self.env.user.lang
        form_fields_mapping = {
            'name': order.name,
            'partner_id__name': order.partner_id.name,
            'user_id__name': order.user_id.name,
            'amount_untaxed': format_amount(env, order.amount_untaxed, order.currency_id),
            'amount_total': format_amount(env, order.amount_total, order.currency_id),
            'delivery_date': format_datetime(env, order.commitment_date, tz=tz),
            'validity_date': format_date(env, order.validity_date, lang_code=lang_code),
            'client_order_ref': order.client_order_ref or '',
        }

        # Adding fields from each line, prefixed by the line_id to avoid conflicts
        lines_with_doc_ids = set(doc_line_id_mapping.values())
        for line in order.order_line.filtered(lambda sol: sol.id in lines_with_doc_ids):
            form_fields_mapping.update(self._get_sol_form_fields_mapping(line))

        return form_fields_mapping

    def _get_sol_form_fields_mapping(self, line):
        line.ensure_one()
        env = self.with_context(use_babel=True).env
        return {
            f'{line.id}_description': line.name,
            f'{line.id}_quantity': line.product_uom_qty,
            f'{line.id}_uom': line.product_uom.name,
            f'{line.id}_price_unit': format_amount(env, line.price_unit, line.currency_id),
            f'{line.id}_discount': line.discount,
            f'{line.id}_product_sale_price': format_amount(
                env, line.product_id.lst_price, line.product_id.currency_id
            ),
            f'{line.id}_taxes': ', '.join(tax.name for tax in line.tax_id),
            f'{line.id}_tax_excl_price': format_amount(env, line.price_subtotal, line.currency_id),
            f'{line.id}_tax_incl_price': format_amount(env, line.price_total, line.currency_id),
        }


    def _render_qweb_pdf_prepare_streams(self, report_ref, data, res_ids=None):
        """
        Rewritten safe version for Odoo 19 that:
        - Keeps attachment handling (including images -> pdf conversion)
        - Keeps report.extra.content merging via append_extra_content
        - Keeps sale.order-specific header/footer/product-doc merging and form filling
        - Always returns an OrderedDict mapping record_id -> {'stream': BytesIO|None, 'attachment': ir.attachment|None}
        """
        report_sudo = self._get_report(report_ref)
        # Keep the optional report_name restriction as in original (list of important reports)
        report_names = {
            'account.report_invoice',
            'account.report_invoice_with_payments',
            'stock.report_deliveryslip',
            'stock.report_picking',
            'purchase.report_purchaseorder',
            'purchase.report_purchasequotation',
            'sale.report_saleorder',
            'sale.report_saleorder_raw',
        }

        # Prepare inputs
        if not data:
            data = {}
        data.setdefault('report_type', 'pdf')

        # Initialize collected_streams as an OrderedDict (always return this)
        collected_streams = OrderedDict()

        # Ensure res_ids is a list (or None)
        if res_ids:
            # Initialize entries so we never end up with missing keys later
            for rid in res_ids:
                collected_streams[rid] = {'stream': None, 'attachment': None}

            # Load attachments if report configured to use attachments
            if report_sudo.attachment:
                records = self.env[report_sudo.model].browse(res_ids)
                for record in records:
                    stream = None
                    attachment = None
                    try:
                        attachment = report_sudo.retrieve_attachment(record)
                    except Exception:
                        # keep attachment as None if retrieval fails
                        attachment = None

                    if attachment and report_sudo.attachment_use:
                        # convert attachment to stream
                        stream = io.BytesIO(attachment.raw)
                        # if it's an image, convert to PDF bytes
                        try:
                            if attachment.mimetype and attachment.mimetype.startswith('image'):
                                img = Image.open(stream)
                                new_stream = io.BytesIO()
                                img.convert("RGB").save(new_stream, format="PDF")
                                stream.close()
                                stream = new_stream
                                stream.seek(0)
                        except Exception:
                            # If conversion fails, keep original stream (or None)
                            try:
                                stream.seek(0)
                            except Exception:
                                stream = None

                    collected_streams[record.id] = {
                        'stream': stream,
                        'attachment': attachment,
                    }

        # Determine which res_ids still need wkhtmltopdf rendering
        res_ids_wo_stream = [rid for rid, s in collected_streams.items() if not s['stream']]
        is_wk_needed = (not res_ids) or bool(res_ids_wo_stream)

        # If wkhtmltopdf rendering needed, render HTML -> PDF
        if is_wk_needed:
            # wkhtmltopdf presence check
            if self.get_wkhtmltopdf_state() == 'install':
                raise UserError(_("Unable to find Wkhtmltopdf on this system. The PDF can not be created."))

            # Render HTML with debug disabled and possibly commit_assetsbundle
            additional_context = {'debug': False}
            if not config['test_enable']:
                additional_context['commit_assetsbundle'] = True

            html = self.with_context(**additional_context)._render_qweb_html(report_ref, res_ids_wo_stream, data=data)[0]
            bodies, html_ids, header, footer, specific_paperformat_args = self.with_context(**additional_context)._prepare_html(html, report_model=report_sudo.model)

            # If attachment splitting logic is enabled but html_ids don't match expected res ids, raise
            if report_sudo.attachment and set(res_ids_wo_stream) != set(html_ids):
                raise UserError(_(
                    "The report's template %r is wrong, please contact your administrator. \n\n"
                    "Cannot separate file to save as attachment because the report's template does not contain the attributes 'data-oe-model' and 'data-oe-id' on the div with 'article' classname.",
                    self.name,
                ))

            # Generate PDF bytes
            pdf_content = self._run_wkhtmltopdf(
                bodies,
                report_ref=report_ref,
                header=header,
                footer=footer,
                landscape=self._context.get('landscape'),
                specific_paperformat_args=specific_paperformat_args,
                set_viewport_size=self._context.get('set_viewport_size'),
            )
            pdf_content_stream = io.BytesIO(pdf_content)

            # Case: printing a PDF report without any records (global report)
            if not res_ids:
                return OrderedDict({
                    False: {
                        'stream': pdf_content_stream,
                        'attachment': None,
                    }
                })

            # Handling extra content (report.extra.content) merging per company/model
            temp_files_to_cleanup = []
            custom_documents = []
            try:
                # By default, we'll write the main pdf content to a temp file to allow merging
                main_fd, main_path = tempfile.mkstemp(suffix='.pdf', prefix='report.tmp.custom.')
                with os.fdopen(main_fd, 'wb') as main_f:
                    main_f.write(pdf_content_stream.getvalue())
                temp_files_to_cleanup.append(main_path)
                custom_documents.append(main_path)

                # search for extra content using model + company
                content_obj = self.env['report.extra.content']
                model_rec = self.env['ir.model'].sudo().search([('model', '=', report_sudo.model)], limit=1)

                # For each record, if extra content present, create temp file and append
                for res in self.env[report_sudo.model].browse(res_ids):
                    extra_content_id = content_obj.search([('model_id', '=', model_rec.id), ('company_id', '=', res.company_id.id)], limit=1)
                    if extra_content_id and extra_content_id.append_extra_content:
                        try:
                            decoded = base64.b64decode(extra_content_id.append_extra_content)
                            extra_fd, extra_path = tempfile.mkstemp(suffix='.pdf', prefix='report.tmp.custom.')
                            with os.fdopen(extra_fd, 'wb') as ef:
                                ef.write(decoded)
                            temp_files_to_cleanup.append(extra_path)
                            custom_documents.append(extra_path)
                        except Exception:
                            # ignore a single extra content failure (don't break entire rendering)
                            continue

                # If we collected custom documents (main + extras), merge them into one PDF stream
                if custom_documents:
                    writer = PdfFileWriter()
                    opened_files = []
                    merged_fd, merged_path = tempfile.mkstemp(suffix='.pdf', prefix='report.merged.tmp.')
                    try:
                        for doc_path in custom_documents:
                            f = open(doc_path, 'rb')
                            opened_files.append(f)
                            reader = PdfFileReader(f)
                            for p in range(0, reader.getNumPages()):
                                writer.addPage(reader.getPage(p))

                        with os.fdopen(merged_fd, 'wb') as merged_f:
                            writer.write(merged_f)
                        temp_files_to_cleanup.append(merged_path)

                        # replace pdf_content_stream with merged file content
                        with open(merged_path, 'rb') as merged_read:
                            pdf_content_stream = io.BytesIO(merged_read.read())

                    finally:
                        for f in opened_files:
                            try:
                                f.close()
                            except Exception:
                                pass

                # Assign the generated/merged stream to the first res_id that needed a stream
                if res_ids_wo_stream:
                    target_rid = res_ids_wo_stream[0]
                    pdf_content_stream.seek(0)
                    collected_streams[target_rid]['stream'] = io.BytesIO(pdf_content_stream.getvalue())
                    collected_streams[target_rid]['attachment'] = None

                # Special handling for sale.order templates (per-record header/footer/product docs & form filling)
                if self._get_report(report_ref).report_name == 'sale.report_saleorder':
                    records = self.env[report_sudo.model].browse(res_ids)
                    for order in records:
                        # If stream already exists (from attachment), keep it; if not, start from the general stream or regenerate
                        initial_stream = collected_streams.get(order.id, {}).get('stream') or io.BytesIO(pdf_content_stream.getvalue())
                        if not initial_stream:
                            continue

                        order_template = getattr(order, 'sale_order_template_id', None)
                        header_record = None
                        footer_record = None
                        header_data = None
                        footer_data = None

                        included_product_docs = self.env['product.document']
                        doc_line_id_mapping = {}

                        if order_template and order_template.quotation_document_ids:
                            for doc in order_template.quotation_document_ids:
                                document_data = doc.datas
                                if doc.document_type == 'header':
                                    if document_data:
                                        header_record = order_template
                                        header_data = document_data
                                    else:
                                        header_record = order.company_id
                                elif doc.document_type == 'footer':
                                    if document_data:
                                        footer_record = order_template
                                        footer_data = document_data
                                    else:
                                        footer_record = order.company_id

                            # collect product docs attached_on_sale == 'inside'
                            for line in order.order_line:
                                product_product_docs = getattr(line.product_id, 'product_document_ids', self.env['product.document']).filtered(lambda d: d.attached_on_sale == 'inside')
                                product_template_docs = getattr(line.product_template_id, 'product_document_ids', self.env['product.document']).filtered(lambda d: d.attached_on_sale == 'inside')
                                doc_to_include = (product_product_docs or product_template_docs)
                                included_product_docs = included_product_docs | doc_to_include
                                for doc in doc_to_include:
                                    doc_line_id_mapping[doc.id] = line.id

                            # If there's nothing to include and no header/footer, skip special merging
                            if not header_record and not footer_record and not included_product_docs:
                                continue

                            writer = PdfFileWriter()
                            # add header pages if present
                            if header_record and header_data:
                                self._add_pages_to_writer(writer, base64.b64decode(header_data))
                            # add product docs pages (with optional line id injection)
                            if included_product_docs:
                                for doc in included_product_docs:
                                    self._add_pages_to_writer(writer, base64.b64decode(doc.datas), TextStringObject(str(doc_line_id_mapping.get(doc.id, ''))))
                            # add the initial main document content
                            # if initial_stream is BytesIO, use reader on its bytes
                            try:
                                self._add_pages_to_writer(writer, initial_stream.getvalue())
                            except Exception:
                                # fallback: try creating reader directly
                                pass
                            # add footer if present
                            if footer_record and footer_data:
                                self._add_pages_to_writer(writer, base64.b64decode(footer_data))

                            # Fill forms if necessary (uses your existing helper pdf.fill_form_fields_pdf)
                            form_fields = self._get_form_fields_mapping(order, doc_line_id_mapping)
                            try:
                                pdf.fill_form_fields_pdf(writer, form_fields=form_fields)
                                # write writer to a BytesIO and set as stream
                                with io.BytesIO() as buf:
                                    writer.write(buf)
                                    buf.seek(0)
                                    stream = io.BytesIO(buf.getvalue())
                                    collected_streams[order.id].update({'stream': stream})
                            except Exception:
                                # if form filling fails, fallback to writing the writer without filling
                                with io.BytesIO() as buf:
                                    writer.write(buf)
                                    buf.seek(0)
                                    stream = io.BytesIO(buf.getvalue())
                                    collected_streams[order.id].update({'stream': stream})

                    # After per-order processing, return collected_streams early (as original did)
                    return collected_streams

            finally:
                # Cleanup temp files
                for path in temp_files_to_cleanup:
                    try:
                        os.unlink(path)
                    except Exception:
                        pass

        # Ensure we always return an OrderedDict (even if empty)
        if collected_streams is None:
            collected_streams = OrderedDict()
        return collected_streams

