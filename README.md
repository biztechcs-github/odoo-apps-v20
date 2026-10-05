# 20.0 apps

Odoo 20.0 addons.

| Module | Name | Odoo dependencies | Manual |
| --- | --- | --- | --- |
| `biztech_report_template` | Clever Multiple Invoice Template | `account`, `sale_management`, `purchase`, `barcodes`, `sale_stock` | [User manual (PDF)](biztech_report_template/OdooCleverMultipleInvoiceTemplates.pdf) |
| `general_template` | Clever All In One Report Templates | `account`, `sale_management`, `delivery`, `stock`, `purchase`, `partner_autocomplete`, `stock_delivery` | [User manual (PDF)](general_template/Odoo%20Clever%20All%20In%20One%20Report%20Templates.pdf) |
| `biztech_website_megamenu` | Advance Mega Menu | `website_sale`, `website` | [User manual (PDF)](biztech_website_megamenu/Odoo%20Advance%20Mega%20Menu%20-%20User%20Manual.pdf) |

## Setup after cloning

### 1. Python packages

All addons in this repository share a single `requirements.txt` at the repo
root:

```bash
python3.12 -m pip install --user -r requirements.txt
```

That installs:

- `img2pdf==0.6.3` (pulls in `pikepdf`)
- `fpdf==1.7.2`

Install **`fpdf`, not `fpdf2`.** `models/report_extra_content.py` uses the PyFPDF
1.x API — `pdf.write(..., txt=...)` and `pdf.output(path, 'F')` — and both were
removed in `fpdf2`.

`num2words` is also listed in the modules' `external_dependencies`, but Odoo 20
core already pins it in its own `requirements.txt`, so it needs no separate
install. The same goes for `Pillow` and `reportlab`.

`biztech_website_megamenu` needs **no** Python packages.
