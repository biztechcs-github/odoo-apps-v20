# -*- coding: utf-8 -*-
# Part of AppJetty. See LICENSE file for full copyright and licensing details.

from odoo import fields, models


class ProductCategory(models.Model):
    _inherit = 'product.public.category'

    # Label differs from website_sale's website_description to avoid a duplicate-label warning.
    description = fields.Text(string="Mega Menu Description", translate=True,
                              help="Short description will be visible in mega menu below category slider.")
