import requests
import re
import json
import os
import smtplib
import hashlib
import time
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

BASE_URL = "https://www.pciconcursos.com.br"
TARGET_URL = f"{BASE_URL}/concursos/sul/"
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
SEEN_FILE = DATA_DIR / "seen.json"
THREAD_FILE = DATA_DIR / "thread.json"
SITE_URL = "https://jesse-rr.github.io"
HEADERS = {"User-Agent": "Mozilla/5.0"}

IT_KEYWORDS = [
    "analista de sistemas", "analista de ti", "analista de tecnologia",
    "desenvolvedor", "programador", "engenheiro de software",
    "administrador de banco de dados", "dba", "administrador de rede",
    "suporte de ti", "infraestrutura de ti",
    "seguranca da informacao", "segurança da informação",
    "cientista de dados", "ciencia de dados", "ciência de dados",
    "engenheiro de dados", "analista de dados",
    "devops", "cloud computing",
    "tecnico de informatica", "técnico de informática",
    "tecnico em informatica", "técnico em informática",
    "tecnologia da informacao", "tecnologia da informação",
    "analista de suporte", "web designer", "webdesigner",
    "fullstack", "full stack", "full-stack",
    "frontend", "front end", "front-end",
    "backend", "back end", "back-end",
    "engenheiro de computacao", "engenheiro de computação",
    "analista de desenvolvimento",
    "arquiteto de software", "arquiteto de sistemas",
    "analista de infraestrutura", "analista de redes",
    "analista de seguranca", "analista de segurança",
    "machine learning", "inteligencia artificial", "inteligência artificial",
    "business intelligence",
    "scrum master", "product owner",
    "governanca de ti", "governança de ti",
    "gestao de ti", "gestão de ti",
    "sistemas de informacao", "sistemas de informação",
    "ciencia da computacao", "ciência da computação",
    "tecnico em processamento de dados", "técnico em processamento de dados",
    "analista de informática", "analista de informatica",
    "gestor de ti",
]


def normalize(text):
    import unicodedata
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return text.lower().strip()


def load_json(path, default):
    if path.exists():
        return json.loads(path.read_text())
    return default


def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2))


def parse_deadline(text):
    text = text.strip()
    if not text or text.lower() in ("suspenso", "prorrogado", "anulado", "n/a"):
        return None
    m = re.search(r"(\d{2})/(\d{2})/(\d{4})", text)
    if m:
        try:
            return datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))
        except ValueError:
            return None
    return None


def scrape_listing():
    resp = requests.get(TARGET_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    html = resp.text

    contests = []
    cards = re.findall(r'<div class="ca">(.*?)<div class="clear">', html, re.DOTALL)

    for card in cards:
        state_m = re.search(r'<div class="cc">(.*?)</div>', card)
        if not state_m or state_m.group(1).strip() != "SC":
            continue

        link_m = re.search(r'<a href="([^"]+)"[^>]*>(.*?)</a>', card)
        if not link_m:
            continue

        href = link_m.group(1).strip()
        name = re.sub(r"<[^>]+>", "", link_m.group(2)).strip()
        url = href if href.startswith("http") else BASE_URL + href

        cd_m = re.search(r'<div class="cd">(.*?)</div>', card, re.DOTALL)
        cd_text = re.sub(r"<[^>]+>", " ", cd_m.group(1)).strip() if cd_m else ""

        if "Superior" not in cd_text:
            continue

        ce_m = re.search(r'<div class="ce"><span>(.*?)</span>', card)
        deadline_str = ce_m.group(1).strip() if ce_m else ""

        deadline_dt = parse_deadline(deadline_str)
        if deadline_dt and deadline_dt < datetime.now():
            continue

        if not deadline_dt and deadline_str.lower() in ("suspenso", "anulado"):
            continue

        vacancies = ""
        if cd_m:
            first_line = re.sub(r"<[^>]+>", "", cd_m.group(1).split("<br")[0]).strip()
            vacancies = first_line

        contests.append({
            "name": name,
            "url": url,
            "deadline": deadline_str,
            "vacancies": vacancies,
        })

    return contests


def fetch_detail_positions(url):
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        html = resp.text
    except Exception:
        return []

    m = re.search(r'itemprop="articleBody">(.*?)</(?:div|article)>', html, re.DOTALL)
    if not m:
        return []

    body = m.group(1)
    items = re.findall(r"<li>(.*?)</li>", body, re.DOTALL)
    positions = []
    for item in items:
        clean = re.sub(r"<[^>]+>", "", item).strip()
        if clean:
            positions.append(clean)

    if not positions:
        text = re.sub(r"<[^>]+>", "\n", body)
        for line in text.split("\n"):
            line = line.strip()
            if re.match(r"^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇ]", line) and len(line) < 120:
                if any(w in line.lower() for w in ["vaga", "hora", "cadastro"]):
                    positions.append(line)

    return positions


def find_it_positions(positions):
    matched = []
    for pos in positions:
        pos_norm = normalize(pos)
        for kw in IT_KEYWORDS:
            kw_norm = normalize(kw)
            if kw_norm in pos_norm:
                matched.append(pos)
                break
    return matched


def build_email(contests):
    rows = ""
    for c in contests:
        pos_list = "".join(
            f'<li style="padding:2px 0;color:#333;font-size:13px;">{p}</li>'
            for p in c["it_positions"]
        )

        rows += f"""
        <tr>
          <td style="padding:20px 24px;border-bottom:1px solid #eee;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:6px;">
                    {c['name']}
                  </div>
                  <div style="font-size:13px;color:#666;margin-bottom:4px;">
                    {c['vacancies']}
                  </div>
                  <div style="font-size:13px;color:#c0392b;font-weight:600;margin-bottom:10px;">
                    Inscricoes ate {c['deadline']}
                  </div>
                  <div style="font-size:12px;color:#555;margin-bottom:10px;">
                    Vagas de TI encontradas:
                  </div>
                  <ul style="margin:0 0 14px 16px;padding:0;">{pos_list}</ul>
                  <a href="{c['url']}"
                     style="display:inline-block;background:#2c3e50;color:#fff;
                     padding:8px 20px;border-radius:4px;text-decoration:none;
                     font-size:13px;font-weight:600;">
                    Acessar concurso
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;">
    <tr><td align="center" style="padding:20px 0;">
      <table width="580" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:8px;overflow:hidden;">

        <tr>
          <td style="background:#2c3e50;padding:24px;text-align:center;">
            <div style="color:#fff;font-size:20px;font-weight:700;">
              Concursos de TI — Santa Catarina
            </div>
            <div style="color:#bdc3c7;font-size:13px;margin-top:4px;">
              {len(contests)} novo(s) encontrado(s)
            </div>
          </td>
        </tr>

        {rows}

        <tr>
          <td style="padding:16px 24px;text-align:center;background:#fafafa;
                     border-top:1px solid #eee;">
            <div style="font-size:11px;color:#999;">
              Fonte:
              <a href="{TARGET_URL}" style="color:#999;">PCI Concursos</a>
              &nbsp;|&nbsp;
              <a href="{SITE_URL}/cancelar/" style="color:#999;">Cancelar inscricao</a>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body></html>"""


def send_email(html, recipient):
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ["SMTP_USER"]
    smtp_pass = os.environ["SMTP_PASS"]

    thread = load_json(THREAD_FILE, {})
    thread_id = thread.get("message_id")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Concursos de TI — SC"
    msg["From"] = smtp_user
    msg["To"] = recipient

    new_id = f"<concursos-ti-sc-{int(time.time())}@jesse-rr.github.io>"
    msg["Message-ID"] = new_id

    if thread_id:
        msg["In-Reply-To"] = thread_id
        msg["References"] = thread_id

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, recipient, msg.as_string())

    if not thread_id:
        save_json(THREAD_FILE, {"message_id": new_id})


def main():
    recipient = os.environ.get("NOTIFY_EMAIL")
    if not recipient:
        print("NOTIFY_EMAIL not set")
        return

    seen = load_json(SEEN_FILE, [])
    all_contests = scrape_listing()
    print(f"SC / Superior / abertos: {len(all_contests)}")

    new_contests = [c for c in all_contests if c["url"] not in seen]
    print(f"Novos: {len(new_contests)}")

    it_contests = []
    for c in new_contests:
        positions = fetch_detail_positions(c["url"])
        it_pos = find_it_positions(positions)
        if it_pos:
            c["it_positions"] = it_pos
            it_contests.append(c)
        time.sleep(0.5)

    print(f"Com vagas de TI: {len(it_contests)}")

    seen.extend(c["url"] for c in new_contests)
    save_json(SEEN_FILE, seen)

    if it_contests:
        html = build_email(it_contests)
        send_email(html, recipient)
        print(f"Email enviado para {recipient}")
    else:
        print("Nenhum concurso novo de TI encontrado")


if __name__ == "__main__":
    main()
