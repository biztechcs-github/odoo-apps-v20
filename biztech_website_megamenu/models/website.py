# -*- coding: utf-8 -*-
# Part of AppJetty. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models


class WebsiteMenu(models.Model):
    _inherit = "website.menu"

    is_megamenu = fields.Boolean(string='Is megamenu...?')
    megamenu_type = fields.Selection([('2_col', '2 Columns'),
                                      ('3_col', '3 Columns'),
                                      ('4_col', '4 Columns')],
                                     default='3_col',
                                     string="Megamenu type")

    megamenu_bg = fields.Boolean(
        string='Want to set megamenu background', default=False)
    megamenu_bg_img_color = fields.Selection([('bg_img', 'Background image'),
                                              ('bg_color', 'Background color')],
                                             default='bg_img',
                                             string="Megamenu background selection")
    megamenu_bg_image = fields.Binary(string="Background image for megamenu")
    megamenu_bg_color = fields.Char(string="Background color for megamenu",
                                    default='#ccc',
                                    help="Background color for megamenu, for setting background color you have to pass hexacode here.")

    menu_icon = fields.Boolean(
        string='Want to display menu icon', default=False)
    menu_icon_image = fields.Binary(
        string="Menu Icon", help="Menu icon for your menu")

    display_menu_footer = fields.Boolean(string="Display menu footer", default=False,
                                         help="For displaying footer in megamenu")
    menu_footer = fields.Html(string="Footer content", translate=True,
                              help="Footer name for megamenu")

    customize_menu_colors = fields.Boolean(
        string='Want to customize menu colors', default=False)
    main_category_color = fields.Char(string='Main category color',
                                      help="Set color for main category in megamenu")
    sub_category_color = fields.Char(string='Sub category color',
                                     help="Set color for sab category in megamenu")

# 2 level Category and static Image Updation
    special_feature = fields.Selection([('category_slider', 'Category slider'),
                                        ('static_image', 'Static image')], string="Special features", default='category_slider', help="You can select any one to display it in the megamenu")

    carousel_header_name = fields.Char(string="Slider label",
                                       default="Latest", translate=True,
                                       help="Header name for carousel slider in megamenu")
    category_slider_position = fields.Selection([('1', 'Left'), ('2', 'Right')],
                                                default='1', string="Category slider position")

    static_image_position = fields.Selection([('1', 'Left'), ('2', 'Right')], string="Static image position",
                                             help="Use to display image to a specific position.",
                                             default="1", required=True)
    static_image = fields.Binary(
        string="Static image", help="Display static image in mega menu")

    display_category_image = fields.Boolean(
        string="Display category image", help="Use to display image of the main category")
    category_image_position = fields.Selection([
        ('top', 'Top'),
        ('bottom', 'Bottom'), ], string="Category image display position",
        help="Use to display category image at specific position",
        default="top")

# used for including CMS pages in Megamenu
    megamenu_view_type = fields.Selection([('cat_megamenu', 'Category Megamenu'),
                                           ('list_cat_megamenu',
                                            'List Category Megamenu'),
                                           ('pages_megamenu', 'Pages Megamenu'),
                                           ('pages_megamenu_pro',
                                            'Pages Megamenu Pro'),
                                           ('pages_megamenu_pro_max',
                                            'Pages Megamenu Pro Max'),
                                           ('pages_category_megamenu', 'Pages & Category Megamenu')],
                                          default="cat_megamenu",
                                          help="Use to display mega menu as per selection", string="Megamenu View Type")

    add_static_image = fields.Boolean(string='Add Static Image',
                                      default=True,
                                      help="Use to display static image with Left or Right side.")

    add_seperator_line = fields.Boolean(string='Add Separator line',
                                        default=True,
                                        help="Use to add a seperator line to seperate Main and its child")
    category_ids = fields.Many2many("product.public.category", string="Category", domain=[
                                    '|', '|', ('parent_id', '=', False), ('parent_id.parent_id', '=', False), ('parent_id.parent_id.parent_id', '=', False)])

    # for new pages megamenu pro
    display_icon = fields.Binary(string="Display Icon")
    megamenu_page_description = fields.Text(string="Description")
    page_ids = fields.Many2many(
        "website.menu", "website_menu_rel", "menu_id", "page_id", string="Pages")
    static_image_content = fields.Html(string='Static Image Description')

    @api.onchange('megamenu_view_type')
    def _view_type_change(self):
        if self.megamenu_view_type and self.megamenu_view_type in ['pages_megamenu', 'pages_megamenu_pro', 'pages_megamenu_pro_max', 'pages_category_megamenu']:
            self.special_feature = 'static_image'
            self.display_category_image = False
            self.add_static_image = False

        elif self.megamenu_view_type and self.megamenu_view_type not in ['pages_megamenu', 'pages_megamenu_pro', 'pages_megamenu_pro_max', 'pages_category_megamenu']:
            self.special_feature = ''
            self.add_static_image = True
            self.display_category_image = False

        if self.megamenu_view_type and self.megamenu_view_type not in ['pages_megamenu_pro', 'pages_megamenu_pro_max', 'pages_category_megamenu']:
            self.static_image_position = '2'
            self.special_feature = 'static_image'
            self.add_static_image = True


class Website(models.Model):
    _inherit = 'website'

    def get_category_list(self, category):
        cat = []
        for categ in category:
            cat.append(categ.id)
        return cat

    # For pages megamenu
    def get_megamenu_pages(self, submenu):
        menus = self.env['website.menu'].sudo().search(
            [('parent_id', '=', submenu.id)])
        return menus

    # For pages megamenu pro
    def get_pages_megamenu_pro_pages(self, submenu):
        # Re-fetch the submenu record to ensure fresh data
        self.env.cr.execute("SELECT id FROM website_menu WHERE id = %s", (submenu.id,))
        menu = self.env['website.menu'].sudo().browse(submenu.id)
        return menu.page_ids