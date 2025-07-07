# -*- coding: utf-8 -*-
# Part of AppJetty. See LICENSE file for full copyright and licensing details.

from odoo import fields, models


class ProductCategory(models.Model):
    _inherit = 'product.public.category'

    description = fields.Text(string="Description", translate=True,
                              help="Short description will be visible in mega menu below category slider.")
