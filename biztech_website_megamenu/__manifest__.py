# -*- coding: utf-8 -*-
# Part of AppJetty. See LICENSE file for full copyright and licensing details.

{
    'name': 'Advance Mega Menu',
    'description': '''Get Smooth & Simple Site Navigation
        website mega menu
        eCommerce Menu
        eCommerce Category Menu
        multiple columns mega menu
        simple site navigation
        mega menu
        odoo mega menu
        Mega Menu Plugin
        Mega Menu app
        menu app
        category mega menu
        page mega menu
        sub categories menu
        category menu
        advance mega menu
        odoo custom mega menu
        odoo mega menu app
        multiple mega menu
        mega menu customization
        mega menu slider
        menu slider
        slider menu
        website mega menu
        website menu
        ''',
    'summary': 'Get Smooth & Simple Site Navigation',
    'category': 'Website',
    'version': '20.0.0.1',
    'author': 'AppJetty',
    'license': 'OPL-1',
    'website': 'https://www.appjetty.com',
    'depends': ['website_sale','website'],
    'data': [
        'views/product_category_view.xml',
        'views/website_view.xml',
        'views/template.xml',
    ],
    'demo': [
        'data/demo.xml',
    ],
    'installable': True,
    'application': True,
    'images': ['static/description/splash-screen.png'],
    'application': True,
    'price': 79.00,
    'currency': 'USD',
    'assets': {
        'web.assets_frontend': [
            '/biztech_website_megamenu/static/src/scss/style.scss',
            '/biztech_website_megamenu/static/src/js/custom.js',
        ],
    },
}
