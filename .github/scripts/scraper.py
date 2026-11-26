import requests
from bs4 import BeautifulSoup
import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

BASE_URL = "https://www.pciconcursos.com.br"
TARGET_URL = f"{BASE_URL}/concursos/sul/"
DATA_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "seen.json"
SITE_URL = "https://jesse-rr.github.io"

IT_KEYWORDS = [
    "analista de sistemas", "analista de ti", "analista de tecnologia",
    "desenvolvedor", "programador", "engenheiro de software",
    "administrador de banco de dados", "dba", "administrador de rede",
    "suporte", "infraestrutura", "segurança da informação",
    "cientista de dados", "ciência de dados", "data science",
    "engenheiro de dados", "analista de dados",
    "devops", "sre", "cloud", "nuvem",
    "técnico de informática", "tecnologia da informação",
    "analista de suporte", "web designer", "webdesigner",
    "fullstack", "full stack", "frontend", "front end", "front-end",
    "backend", "back end", "back-end",
    "software", "computação", "informática", "ti ",
    "sistemas de informação", "ciência da computação",
    "analista de desenvolvimento", "arquiteto de software",
    "analista de infraestrutura", "analista de redes",
    "analista de segurança", "pentest", "cyber",
    "machine learning", "inteligência artificial",
    "business intelligence", "bi ", "etl",
    "scrum master", "product owner", "agile",
    "ux", "ui ", "designer digital",
    "governança de ti", "gestão de ti",
]


def load_seen():
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text())
    return []


def save_seen(seen):
    DATA_FILE.write_text(json.dumps(seen, ensure_ascii=False, indent=2))


def scrape_contests():
    resp = requests.get(TARGET_URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    contests = []
    for card in soup.select("div.ca"):
        link_tag = card.select_one("a")
        if not link_tag:
            continue

        state_tag = card.select_one("div.cc")
        if not state_tag or state_tag.get_text(strip=True) != "SC":
            continue

        details = card.select_one("div.cd")
        if not details:
            continue

        details_text = details.get_text(" ", strip=True)
        spans = details.find_all("span")
        level_text = spans[-1].get_text(strip=True) if spans else ""

        if "Superior" not in level_text:
            continue

        deadline_tag = card.select_one("div.ce span")
        deadline = deadline_tag.get_text(strip=True) if deadline_tag else "N/A"

        href = link_tag.get("href", "")
        full_url = href if href.startswith("http") else BASE_URL + href
        name = link_tag.get_text(strip=True)

        positions_parts = details_text.split("\n")
        raw = details.decode_contents()
        positions_line = ""
        for span in spans:
            txt = span.get_text(strip=True)
            if txt and txt != level_text:
                positions_line = txt
                break

        if not positions_line:
            positions_line = details_text

        vacancies_line = ""
        first_text = details.find(string=True, recursive=False)
        if first_text:
            vacancies_line = first_text.strip()
        if not vacancies_line:
            for child in details.children:
                if isinstance(child, str) and child.strip():
                    vacancies_line = child.strip()
                    break

        contests.append({
            "name": name,
            "url": full_url,
            "deadline": deadline,
            "positions": positions_line,
            "vacancies": vacancies_line,
            "level": level_text,
        })

    return contests


def filter_it(contests):
    results = []
    for c in contests:
        text = (c["positions"] + " " + c["name"]).lower()
        matched = [kw.strip() for kw in IT_KEYWORDS if kw.strip().lower() in text]
        if matched:
            c["matched_keywords"] = matched
            results.append(c)
    return results


def build_email(contests):
    rows = ""
    for c in contests:
        keywords_badges = "".join(
            f'<span style="display:inline-block;background:#e0f7fa;color:#00695c;'
            f'padding:2px 8px;border-radius:12px;font-size:12px;margin:2px;">{kw}</span>'
            for kw in c["matched_keywords"][:5]
        )
        rows += f"""
        <tr>
          <td style="padding:16px;border-bottom:1px solid #e0e0e0;">
            <h3 style="margin:0 0 4px;color:#1a237e;font-size:16px;">{c['name']}</h3>
            <p style="margin:0 0 4px;color:#555;font-size:13px;">📋 {c['positions']}</p>
            <p style="margin:0 0 4px;color:#555;font-size:13px;">👥 {c['vacancies']}</p>
            <p style="margin:0 0 4px;color:#555;font-size:13px;">🎓 {c['level']}</p>
            <p style="margin:0 0 8px;font-size:13px;">🏷️ {keywords_badges}</p>
            <div style="display:flex;align-items:center;gap:12px;">
              <a href="{c['url']}" style="display:inline-block;background:#1a73e8;color:#fff;
                padding:8px 20px;border-radius:6px;text-decoration:none;font-size:13px;
                font-weight:600;">Ver Concurso →</a>
              <span style="color:#d32f2f;font-weight:600;font-size:13px;">⏰ {c['deadline']}</span>
            </div>
          </td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;
    box-shadow:0 2px 12px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,#1a237e,#283593);padding:28px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">🖥️ Novos Concursos de TI — SC</h1>
      <p style="color:#bbdefb;margin:8px 0 0;font-size:14px;">
        {len(contests)} vaga(s) encontrada(s) hoje
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      {rows}
    </table>

    <div style="padding:20px;text-align:center;background:#fafafa;border-top:1px solid #e0e0e0;">
      <p style="color:#999;font-size:11px;margin:0;">
        Fonte: <a href="{TARGET_URL}" style="color:#1a73e8;">PCI Concursos</a><br>
        <a href="{SITE_URL}/cancelar/" style="color:#999;">Cancelar inscrição</a>
      </p>
    </div>
  </div>
</body></html>"""


def send_email(html, recipient):
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ["SMTP_USER"]
    smtp_pass = os.environ["SMTP_PASS"]

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "🖥️ Novos Concursos de TI em SC"
    msg["From"] = smtp_user
    msg["To"] = recipient
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, recipient, msg.as_string())


def main():
    recipient = os.environ.get("NOTIFY_EMAIL")
    if not recipient:
        print("NOTIFY_EMAIL not set")
        return

    seen = load_seen()
    all_contests = scrape_contests()
    print(f"Total SC/Superior: {len(all_contests)}")

    new_contests = [c for c in all_contests if c["url"] not in seen]
    print(f"Novos: {len(new_contests)}")

    it_contests = filter_it(new_contests)
    print(f"TI: {len(it_contests)}")

    seen.extend(c["url"] for c in new_contests)
    save_seen(seen)

    if it_contests:
        html = build_email(it_contests)
        send_email(html, recipient)
        print(f"Email enviado para {recipient}")
    else:
        print("Nenhum concurso novo de TI encontrado")


if __name__ == "__main__":
    main()
