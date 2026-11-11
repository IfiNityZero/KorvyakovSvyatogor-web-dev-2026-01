from pathlib import Path
import json
import shutil

ROOT = Path(__file__).parent
DISHES = json.loads((ROOT / "data" / "dishes.json").read_text(encoding="utf-8"))

FONT = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap"


def dishes_for(lab):
    cats = ("soup", "main", "drink") if lab < 5 else ("soup", "main", "salad", "drink", "dessert")
    result = {c: [] for c in cats}
    for d in DISHES:
        if d["category"] in result:
            result[d["category"]].append(d)
    if lab <= 3:
        for c in result:
            result[c] = result[c][:3]
    return result


def nav(lab, page):
    items = [("index.html", "Главная")]
    if lab >= 2:
        items.append(("lunch.html", "Собрать ланч"))
    if lab >= 8:
        items.append(("checkout.html", "Оформить заказ"))
    if lab >= 9:
        items.append(("orders.html", "Заказы"))
    if lab >= 10:
        items.append(("landing.html", "Лендинг"))
    items.append(("#contacts", "Контакты"))
    links = []
    for href, title in items:
        cls = ' class="active"' if href == page else ""
        links.append(f'<a href="{href}"{cls}>{title}</a>')
    return "\n      ".join(links)


def head(title, extra_css="", extra_js=(), lab=1, lunch=False):
    lunch_css = '  <link rel="stylesheet" href="../css/lunch.css">\n' if lunch else ""
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="{FONT}">
  <link rel="stylesheet" href="../css/style.css">
{lunch_css}{extra_css}
</head>
<body data-lab="{lab}">
"""


def header_footer(lab, page):
    header = f"""  <header>
    <h1>ЛанчСити</h1>
    <nav>
      {nav(lab, page)}
    </nav>
  </header>
"""
    footer = """  <footer id="contacts">
    <p>ЛанчСити — доставка бизнес-ланчей по Москве</p>
    <p>Телефон: <a href="tel:+74951234567">+7 (495) 123-45-67</a></p>
    <p>Почта: <a href="mailto:hello@lunchcity.ru">hello@lunchcity.ru</a></p>
    <p>Адрес: ул. Прянишникова, 2А</p>
  </footer>
"""
    return header, footer


def about_table():
    return """    <section class="about">
      <h2>О компании</h2>
      <img src="../images/company.jpg" alt="Обед в офисе от ЛанчСити" width="640" height="400">
      <p>ЛанчСити доставляет горячие бизнес-ланчи в офисы Москвы. Соберите обед из супа, горячего и напитка — привезём к нужному времени.</p>
    </section>
    <section class="advantages">
      <h2>Почему мы</h2>
      <ul>
        <li>Доставка к точному времени с 7:00 до 23:00</li>
        <li>Свежие блюда без полуфабрикатов</li>
        <li>Прозрачные цены и комбо на каждый день</li>
        <li>Можно собрать ланч под свой вкус</li>
      </ul>
    </section>
    <section class="popular">
      <h2>Самые популярные блюда</h2>
      <table>
        <thead>
          <tr><th>Блюдо</th><th>Категория</th><th>Вес</th><th>Цена</th></tr>
        </thead>
        <tbody>
          <tr><td>Гаспачо</td><td>Суп</td><td>350 г</td><td>195 ₽</td></tr>
          <tr><td>Борщ с говядиной</td><td>Суп</td><td>400 г</td><td>250 ₽</td></tr>
          <tr><td>Стейк из лосося</td><td>Горячее</td><td>270 г</td><td>490 ₽</td></tr>
          <tr><td>Ризотто с грибами</td><td>Горячее</td><td>260 г</td><td>310 ₽</td></tr>
          <tr><td>Апельсиновый фреш</td><td>Напиток</td><td>300 мл</td><td>150 ₽</td></tr>
        </tbody>
      </table>
    </section>
"""


def dish_card(d, button="Добавить"):
    return f"""          <div class="dish">
            <img src="{d['image']}" alt="{d['name']}">
            <p class="price">{d['price']} ₽</p>
            <p class="name">{d['name']}</p>
            <p class="count">{d['count']}</p>
            <button type="button">{button}</button>
          </div>
"""


TITLES = {
    "soup": "Супы",
    "main": "Главные блюда",
    "salad": "Салаты и стартеры",
    "drink": "Напитки",
    "dessert": "Десерты",
}

FILTERS = {
    "soup": [("fish", "рыбный"), ("meat", "мясной"), ("veg", "вегетарианский")],
    "main": [("fish", "рыбное"), ("meat", "мясное"), ("veg", "вегетарианское")],
    "salad": [("fish", "рыбный"), ("meat", "мясной"), ("veg", "вегетарианский")],
    "drink": [("cold", "холодный"), ("hot", "горячий")],
    "dessert": [("small", "маленькая порция"), ("medium", "средняя порция"), ("large", "большая порция")],
}


def static_menu(grouped):
    parts = []
    for cat, items in grouped.items():
        cards = "".join(dish_card(d) for d in items)
        parts.append(f"""    <section>
      <h2>{TITLES[cat]}</h2>
      <div class="dishes">
{cards}      </div>
    </section>
""")
    return "".join(parts)


def js_menu(lab):
    cats = dishes_for(lab).keys()
    parts = []
    for cat in cats:
        filters = ""
        if lab >= 5:
            btns = "".join(f'<button type="button" data-kind="{k}">{t}</button>' for k, t in FILTERS[cat])
            filters = f'      <div class="filters">{btns}</div>\n'
        title = {
            "soup": "Выберите суп",
            "main": "Выберите главное блюдо",
            "salad": "Выберите салат или стартер",
            "drink": "Выберите напиток",
            "dessert": "Выберите десерт",
        }[cat]
        parts.append(f"""    <section data-category="{cat}">
      <h2>{title}</h2>
{filters}      <div class="dishes"></div>
    </section>
""")
    return "".join(parts)


def form_block(lab):
    if lab < 3:
        return ""
    soup_opts = "".join(f'<option value="{d["keyword"]}">{d["name"]}</option>' for d in DISHES if d["category"] == "soup")
    main_opts = "".join(f'<option value="{d["keyword"]}">{d["name"]}</option>' for d in DISHES if d["category"] == "main")
    drink_opts = "".join(f'<option value="{d["keyword"]}">{d["name"]}</option>' for d in DISHES if d["category"] == "drink")
    salad_opts = "".join(f'<option value="{d["keyword"]}">{d["name"]}</option>' for d in DISHES if d["category"] == "salad")
    dessert_opts = "".join(f'<option value="{d["keyword"]}">{d["name"]}</option>' for d in DISHES if d["category"] == "dessert")
    extra_selects = ""
    if lab >= 5:
        extra_selects = f"""
          <label for="salad">Салат</label>
          <select id="salad" name="salad">
            <option value="">Выберите салат</option>{salad_opts}
          </select>
          <label for="dessert">Десерт</label>
          <select id="dessert" name="dessert">
            <option value="">Выберите десерт</option>{dessert_opts}
          </select>
"""
    hidden = ""
    if lab >= 4:
        hidden = """
          <input type="hidden" name="soup" id="hidden-soup">
          <input type="hidden" name="main_course" id="hidden-main">
          <input type="hidden" name="drink" id="hidden-drink">
"""
        soup_block = """
          <div id="order-summary"><p>Ничего не выбрано</p></div>
          <p id="order-cost" hidden></p>
"""
        selects = ""
        if lab >= 5:
            hidden += """          <input type="hidden" name="salad" id="hidden-salad">
          <input type="hidden" name="dessert" id="hidden-dessert">
"""
    else:
        soup_block = f"""
          <label for="soup">Суп</label>
          <select id="soup" name="soup" required>
            <option value="">Выберите суп</option>{soup_opts}
          </select>
          <label for="main_course">Главное блюдо</label>
          <select id="main_course" name="main_course" required>
            <option value="">Выберите главное блюдо</option>{main_opts}
          </select>
          <label for="drink">Напиток</label>
          <select id="drink" name="drink" required>
            <option value="">Выберите напиток</option>{drink_opts}
          </select>
          {extra_selects}
"""
        selects = soup_block
        soup_block = selects

    return f"""    <section>
      <h2>Сделать заказ</h2>
      <form id="order-form" class="order-form" action="https://httpbin.org/post" method="post">
        <div>
          <h3>Ваш заказ</h3>
          {soup_block}
          <label for="comment">Комментарий</label>
          <textarea id="comment" name="comment"></textarea>
          {hidden}
        </div>
        <div>
          <h3>Данные клиента</h3>
          <label for="full_name">Имя</label>
          <input id="full_name" name="full_name" type="text" required>
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required>
          <input id="subscribe" name="subscribe" type="checkbox" checked style="width:auto;display:inline">
          <label for="subscribe" style="display:inline">Хочу получать новости и акции</label>
          <label for="phone">Телефон</label>
          <input id="phone" name="phone" type="tel" required>
          <label for="delivery_address">Адрес</label>
          <input id="delivery_address" name="delivery_address" type="text" required>
          <fieldset>
            <legend>Время доставки</legend>
            <input id="now" name="delivery_type" type="radio" value="now" required style="width:auto;display:inline">
            <label for="now" style="display:inline">Как можно скорее</label>
            <input id="by_time" name="delivery_type" type="radio" value="by_time" style="width:auto;display:inline">
            <label for="by_time" style="display:inline">Ко времени</label>
          </fieldset>
          <label for="delivery_time">Укажите время</label>
          <input id="delivery_time" name="delivery_time" type="time" min="07:00" max="23:00" step="300">
          <div class="form-actions">
            <button type="reset" class="reset">Сбросить</button>
            <button type="submit" class="submit">Отправить</button>
          </div>
        </div>
      </form>
    </section>
"""


def combos_block():
    variants = [
        [("icon-soup.jpg", "Суп"), ("icon-main.jpg", "Главное блюдо"), ("icon-salad.jpg", "Салат"), ("icon-drink.jpg", "Напиток")],
        [("icon-soup.jpg", "Суп"), ("icon-main.jpg", "Главное блюдо"), ("icon-drink.jpg", "Напиток")],
        [("icon-soup.jpg", "Суп"), ("icon-salad.jpg", "Салат"), ("icon-drink.jpg", "Напиток")],
        [("icon-main.jpg", "Главное блюдо"), ("icon-salad.jpg", "Салат"), ("icon-drink.jpg", "Напиток")],
        [("icon-main.jpg", "Главное блюдо"), ("icon-drink.jpg", "Напиток")],
    ]
    cards = []
    for items in variants:
        inner = ""
        for img, label in items:
            inner += f"""          <div class="combo-item">
            <img src="../images/{img}" alt="{label}">
            <span>{label}</span>
          </div>
"""
        cards.append(f'        <div class="combo">{inner}        </div>\n')
    return f"""    <section>
      <h2>Доступные варианты ланча</h2>
      <div class="combos">
{''.join(cards)}      </div>
      <p>Десерт можно добавить к любому виду ланча.</p>
    </section>
"""


def scripts(lab):
    tags = []
    if lab >= 4:
        tags.append('<script src="../js/config.js"></script>')
        tags.append('<script src="../js/dishes-data.js"></script>')
        tags.append('<script src="../js/app.js" defer></script>')
    return "\n".join("  " + t for t in tags)


def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def page_index(lab):
    h, f = header_footer(lab, "index.html")
    extra = ""
    if lab >= 10:
        extra = ""
    return head("ЛанчСити — главная", lab=lab) + h + "  <main>\n" + about_table() + "  </main>\n" + f + "</body>\n</html>\n"


def page_lunch(lab):
    h, f = header_footer(lab, "lunch.html")
    body = js_menu(lab) if lab >= 4 else static_menu(dishes_for(lab))
    if lab >= 6:
        body = combos_block() + body
    if 3 <= lab <= 7:
        body += form_block(lab)
    if lab >= 8:
        body += """    <div class="checkout-bar" hidden>
      <span>Итого: <b id="bar-total">0 ₽</b></span>
      <a href="checkout.html">Перейти к оформлению</a>
    </div>
"""
    return head("Собрать ланч — ЛанчСити", lab=lab, lunch=True) + h + "  <main>\n" + body + "  </main>\n" + f + scripts(lab) + "\n</body>\n</html>\n"


def page_checkout(lab):
    h, f = header_footer(lab, "checkout.html")
    form = form_block(8)
    body = f"""    <section>
      <h2>Состав заказа</h2>
      <p id="checkout-empty">Ничего не выбрано. Чтобы добавить блюда в заказ, перейдите на страницу <a href="lunch.html">Собрать ланч</a>.</p>
      <div id="checkout-dishes" class="dishes"></div>
    </section>
    <div id="checkout-form-wrap">
{form}    </div>
"""
    return head("Оформить заказ — ЛанчСити", lab=lab, lunch=True) + h + "  <main>\n" + body + "  </main>\n" + f + scripts(lab) + "\n</body>\n</html>\n"


def page_orders(lab):
    h, f = header_footer(lab, "orders.html")
    body = """    <section>
      <h2>Заказы</h2>
      <table class="orders-table">
        <thead>
          <tr>
            <th>№</th><th>Дата</th><th>Состав</th><th>Стоимость</th><th>Доставка</th><th>Действия</th>
          </tr>
        </thead>
        <tbody id="orders-body"></tbody>
      </table>
    </section>
"""
    return head("Заказы — ЛанчСити", lab=lab) + h + "  <main>\n" + body + "  </main>\n" + f + scripts(lab) + "\n</body>\n</html>\n"


def page_landing(lab):
    h, f = header_footer(lab, "landing.html")
    extra = """  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
"""
    body = """  <main class="container py-4">
    <section class="row align-items-center g-4 py-5">
      <div class="col-lg-6">
        <h2 class="display-5 fw-bold">Горячий бизнес-ланч к вашему времени</h2>
        <p class="lead">ЛанчСити готовит супы, горячее, салаты и десерты и привозит их в офисы Москвы.</p>
      </div>
      <div class="col-lg-6">
        <img class="img-fluid rounded" src="../images/company.jpg" alt="ЛанчСити">
      </div>
    </section>
    <section class="row text-center g-4 py-4">
      <div class="col-md-4"><div class="p-4 bg-white rounded shadow-sm"><h3>К времени</h3><p>Доставка с 7:00 до 23:00 с шагом 5 минут.</p></div></div>
      <div class="col-md-4"><div class="p-4 bg-white rounded shadow-sm"><h3>Комбо</h3><p>Пять готовых схем ланча плюс десерт по желанию.</p></div></div>
      <div class="col-md-4"><div class="p-4 bg-white rounded shadow-sm"><h3>Свежо</h3><p>Блюда дня без заморозки и полуфабрикатов.</p></div></div>
    </section>
    <section class="text-center py-5">
      <h2>Соберите обед за пару минут</h2>
      <p>Выберите суп, горячее и напиток — остальное подскажет меню.</p>
      <a class="btn btn-danger btn-lg" href="lunch.html">Собрать ланч</a>
    </section>
    <section class="row g-4 py-4">
      <div class="col-md-6">
        <h2>Напишите нам</h2>
        <form>
          <div class="mb-3"><label class="form-label" for="fb-name">Имя</label><input class="form-control" id="fb-name"></div>
          <div class="mb-3"><label class="form-label" for="fb-email">Email</label><input class="form-control" id="fb-email" type="email"></div>
          <div class="mb-3"><label class="form-label" for="fb-msg">Сообщение</label><textarea class="form-control" id="fb-msg"></textarea></div>
          <button class="btn btn-dark" type="button">Отправить</button>
        </form>
      </div>
      <div class="col-md-6">
        <h2>Контакты</h2>
        <p>+7 (495) 123-45-67</p>
        <p>hello@lunchcity.ru</p>
        <p>ул. Прянишникова, 2А</p>
      </div>
    </section>
  </main>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
"""
    # landing uses bootstrap grid; still keep header/footer from our css
    start = head("Лендинг — ЛанчСити", extra_css=extra, lab=lab)
    return start + h + body + f + "</body>\n</html>\n"


TITLES_LAB = {
    1: "Главная страница компании",
    2: "Меню и адаптив",
    3: "Форма заказа",
    4: "Блюда на JavaScript",
    5: "Фильтры и новые категории",
    6: "Комбо и уведомления",
    7: "Загрузка блюд из API",
    8: "Оформление заказа и localStorage",
    9: "История заказов",
    10: "Лендинг на Bootstrap 5",
}


def hub():
    links = "\n".join(
        f'    <p><a href="lab{n}/index.html">Лабораторная {n}. {TITLES_LAB[n]}</a></p>'
        for n in range(1, 11)
    )
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Лабы по WEB</title>
</head>
<body>
  <h1>Лабы по WEB</h1>
{links}
</body>
</html>
"""


def main():
    (ROOT / "index.html").write_text(hub(), encoding="utf-8")
    for lab in range(1, 11):
        folder = ROOT / f"lab{lab}"
        if folder.exists():
            shutil.rmtree(folder)
        folder.mkdir()
        write(folder / "index.html", page_index(lab))
        if lab >= 2:
            write(folder / "lunch.html", page_lunch(lab))
        if lab >= 8:
            write(folder / "checkout.html", page_checkout(lab))
        if lab >= 9:
            write(folder / "orders.html", page_orders(lab))
        if lab >= 10:
            write(folder / "landing.html", page_landing(lab))
    print("ok")


if __name__ == "__main__":
    main()
