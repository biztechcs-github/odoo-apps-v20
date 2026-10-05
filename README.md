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

### 2. wkhtmltox (system binaries, not pip)

The report modules produce PDFs, which needs `wkhtmltopdf` and `wkhtmltoimage`
installed at OS level from the vendor's `wkhtmltox` package — **0.12.5 with
patched Qt** is the recommended build. These are native binaries and are *not*
installable with pip; do not add them to `requirements.txt`.

Odoo 20 still defaults to this engine:

```python
# odoo/addons/base/models/ir_actions_report.py
def _get_pdf_engine(self, report=None, default_engine='wkhtmltopdf') -> str:
```

What changed in 20.0 is only where the code lives. `base`'s
`get_pdf_engine_state()` is now a stub that always returns `'install'`, and the
real binary detection sits in the `base_report_wkhtmltox` addon. That addon is
`auto_install: True`, so it installs itself — but with no binary on `PATH` the
engine stays in the `install` state and every PDF fails with *"Unable to find
the pdf engine on this system"*.

`base_report_paper_muncher` is the alternative engine and is **not**
auto-installed.

### 3. Run with at least two workers

```bash
odoo-bin --workers 2 ...
```

Below two workers the engine reports state `workers` and renders nothing, even
with a valid `wkhtmltopdf` binary. This catches out single-worker dev servers.

## Notes for Odoo 20

- Requires **Python >= 3.12** (`odoo/release.py`) and **PostgreSQL >= 16**.
- Core dropped `pytz` (now stdlib `zoneinfo`) and `xlwt` (now `XlsxWriter`
  only). None of the modules here use either, but third-party addons often
  assume `pytz` is present — on 20.0 it no longer is.
- Demo data is off by default; pass `--with-demo` if you want it.
