import glob
from bs4 import BeautifulSoup


def test_navbar_links():
    html_files = glob.glob('*.html')
    expected_classes = ['nav-about', 'nav-pubs', 'nav-teaching', 'nav-projects']
    for html_file in html_files:
        with open(html_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'html.parser')
        navbar = soup.find('ul', class_='navbar')
        assert navbar is not None, f"{html_file} missing <ul class='navbar'>"
        link_classes = {cls for a in navbar.find_all('a') for cls in (a.get('class') or [])}
        for expected in expected_classes:
            assert expected in link_classes, f"{html_file} missing link class {expected}"
