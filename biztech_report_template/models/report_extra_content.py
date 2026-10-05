# -*- coding: utf-8 -*-
# Part of AppJetty. See LICENSE file for full copyright and licensing details.

import os
import tempfile
import img2pdf
import subprocess
import base64
from fpdf import FPDF
from contextlib import closing
from odoo import fields, models, api, _
from odoo.exceptions import UserError


class ReportExtraContent(models.Model):
    _name = 'report.extra.content'
    _description = 'Extra Content'
    _rec_name = 'model_id'

    file_name = fields.Char(string="File name")
    append_extra_content = fields.Binary(
        string="Append Extra Content", help="Please upload file (You can upload file like jpg, png, pdf, docx, pptx, xlsx, doc, ppt, xls, txt)")
    model_id = fields.Many2one('ir.model', string="Report Type", required=True, domain=[
                               ('model', 'in', ['account.move'])], ondelete='cascade')
    company_id = fields.Many2one('res.company', string='Company', change_default=True,
                                 required=True, default=lambda self: self.env.company)

    _unique_model_company = models.Constraint(
        'unique (model_id, company_id)',
        'Model and Company must be unique.',
    )

    @api.constrains('file_name', 'append_extra_content')
    def check_upload_file(self):
        if self.append_extra_content and self.file_name and not self.file_name.endswith('.pdf'):
            raise UserError(_('Please upload pdf file only'))

    def _get_upload_bytes(self, values):
        """Return the uploaded file of ``values`` as raw bytes.

        The web client sends a Binary field as {'filename', 'content'} since
        Odoo 20, while server-side callers still pass the base64 string.
        """
        fdata = values.get('append_extra_content')
        if isinstance(fdata, dict):
            fdata = fdata.get('content')
        if isinstance(fdata, str):
            return base64.b64decode(fdata)
        return fdata or b''

    def convert_img2pdf(self, values):
        fname = values.get('file_name')
        fdata = values.get('append_extra_content')
        transfer_file_list = []
        if fname:
            (fname, ext) = os.path.splitext(fname)
            img_file_fd, img_file_path = tempfile.mkstemp(
                suffix=ext, prefix='report.convert.data.')
            transfer_file_list.append(img_file_path)
            fname = '.'.join([fname + '.pdf'])

            with closing(os.fdopen(img_file_fd, 'wb')) as img:
                img.write(self._get_upload_bytes(values))

            content = img2pdf.convert(img_file_path)

            img2pdf_file_fd, img2pdf_file_path = tempfile.mkstemp(
                suffix='.pdf', prefix='report.converted.tmp.')
            with closing(os.fdopen(img2pdf_file_fd, 'wb')) as imgpdf:
                imgpdf.write(content)
            transfer_file_list.append(img2pdf_file_path)

            with open(img2pdf_file_path, 'rb') as fd:
                fdata = fd.read()
        for transfer in transfer_file_list:
            os.unlink(transfer)
        return {'file_name': fname, 'append_extra_content': base64.b64encode(fdata).decode()}

    def _get_mono_font_path(self):
        """Return the UbuntuMono font path, which moved in newer distributions."""
        candidates = [
            '/usr/share/fonts/truetype/ubuntu/UbuntuMono-BI.ttf',
            '/usr/share/fonts/truetype/ubuntu-font-family/UbuntuMono-BI.ttf',
        ]
        for candidate in candidates:
            if os.path.exists(candidate):
                return candidate
        raise UserError(
            _('The UbuntuMono font is required to convert text files to PDF.'))

    def convert_txt2pdf(self, values):
        fname = values.get('file_name')
        fdata = values.get('append_extra_content')
        transfer_file_list = []
        if fname:
            (fname, ext) = os.path.splitext(fname)
            txt_file_fd, txt_file_path = tempfile.mkstemp(
                suffix=ext, prefix='report.convert.data.')
            transfer_file_list.append(txt_file_path)
            fname = '.'.join([fname + '.pdf'])

            with closing(os.fdopen(txt_file_fd, 'wb')) as txt:
                txt.write(self._get_upload_bytes(values))

            pdf = FPDF()
            pdf.add_page()
            pdf.add_font('UbuntuMono', '', self._get_mono_font_path(), uni=True)
            pdf.set_font('UbuntuMono', '', 12)
            for line in open(txt_file_path, 'rb').readlines():
                pdf.write(10, txt=line.decode('utf-8'))

            txt2pdf_file_fd, txtpdf_file_path = tempfile.mkstemp(
                suffix='.pdf', prefix='report.converted.tmp.')
            pdf.output(txtpdf_file_path, 'F')
            transfer_file_list.append(txtpdf_file_path)

            with open(txtpdf_file_path, 'rb') as fd:
                fdata = fd.read()

        for transfer in transfer_file_list:
            os.unlink(transfer)
        return {'file_name': fname, 'append_extra_content': base64.b64encode(fdata).decode()}

    def convert_dxp2pdf(self, values):
        fname = values.get('file_name')
        fdata = values.get('append_extra_content')
        transfer_file_list = []
        if fname:
            (fname, ext) = os.path.splitext(fname)
            dxp_file_fd, dxp_file_path = tempfile.mkstemp(
                suffix=ext, prefix='report.dxp.data.')
            transfer_file_list.append(dxp_file_path)
            fname = '.'.join([fname + '.pdf'])

            with closing(os.fdopen(dxp_file_fd, 'wb')) as dxp:
                dxp.write(self._get_upload_bytes(values))
            output = subprocess.check_output(
                ['libreoffice', '--convert-to', 'pdf', dxp_file_path])
            dxp_file_path = output.split()[3]
            transfer_file_list.append(dxp_file_path)
            with open(dxp_file_path, 'rb') as fd:
                fdata = fd.read()
        for transfer in transfer_file_list:
            os.unlink(transfer)
        return {'file_name': fname, 'append_extra_content': base64.b64encode(fdata).decode()}

    def write(self, values):
        file_name = values.get('file_name', False)
        if file_name and values.get('append_extra_content', False):
            if not file_name.endswith('.pdf'):
                if file_name.endswith('.txt') or file_name.endswith('.text'):
                    values.update(self.convert_txt2pdf(values))
                elif file_name.endswith('jpeg') or file_name.endswith('jpg') or \
                        file_name.endswith('png'):
                    values.update(self.convert_img2pdf(values))
                elif file_name.endswith('docx') or file_name.endswith('doc') or \
                        file_name.endswith('xlsx') or file_name.endswith('xls') or \
                        file_name.endswith('pptx') or file_name.endswith('ppt'):
                    values.update(self.convert_dxp2pdf(values))
        return super(ReportExtraContent, self).write(values)

    @api.model_create_multi
    def create(self, values_list):
        for values in values_list:

            file_name = values.get('file_name', False)
            if file_name and values.get('append_extra_content', False):
                if not file_name.endswith('.pdf'):
                    if file_name.endswith('.txt') or file_name.endswith('.text'):
                        values.update(self.convert_txt2pdf(values))
                    elif file_name.endswith('.jpeg') or file_name.endswith('.jpg') or \
                            file_name.endswith('.png'):
                        values.update(self.convert_img2pdf(values))
                    elif file_name.endswith('docx') or file_name.endswith('doc') or \
                            file_name.endswith('xlsx') or file_name.endswith('xls') or \
                            file_name.endswith('pptx') or file_name.endswith('ppt'):
                        values.update(self.convert_dxp2pdf(values))
        return super(ReportExtraContent, self).create(values)
