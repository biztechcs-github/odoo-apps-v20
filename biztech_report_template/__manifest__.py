# -- coding: utf-8 --
# Part of Appjetty. See LICENSE file for full copyright and licensing details.

{
    'name': 'Clever Multiple Invoice Template',
    'version': '20.0.0.0',
    'author': 'Appjetty',
    'license': 'OPL-1',
    'category': 'Accounting',
    'depends': ['account', 'sale_management', 'purchase', 'barcodes','sale_stock'],
    'website': 'https://www.appjetty.com',
    'description': '''Professional Templates, Professional Report Templates, Customizable Invoice Templates, Multiple Professional Invoice Templates, Customized Invoice''',
    'summary': 'Get Diverse Invoice Templates In One Go!',
    'data': [
        'security/ir.access.csv',
        'data/template_data.xml',
        'views/polished.xml',
        'views/morden.xml',
        'views/vintage.xml',
        'views/bold.xml',
        'views/corporate.xml',
        'views/classic.xml',
        'views/res_company_view.xml',
        'views/res_partner.xml',
        'views/account_move.xml',
        'views/template_report.xml',
        'views/report_extra_content_view.xml',
        'views/custom_invoice_template.xml',
    ],
    'external_dependencies': {
        'python': ['img2pdf', 'fpdf', 'num2words']
    },
    'assets': {
        'web.report_assets_common': [
            'biztech_report_template/static/src/css/template.css',
        ],
    },
    'images': ['static/description/splash-screen.png'],
    'price': 59.00,
    'currency': 'USD',
    'installable': True,
    'auto_install': False,
    'web_preload': True,
}

