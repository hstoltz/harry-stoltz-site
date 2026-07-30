from bs4 import BeautifulSoup


def test_navbar_links():
    html_files = ['index.html', 'publications.html', 'teaching.html', 'projects.html']
    expected_classes = ['nav-about', 'nav-pubs', 'nav-teaching', 'nav-projects']
    for html_file in html_files:
        with open(html_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'html.parser')
        navbar = soup.find('ul', class_='navbar')
        assert navbar is not None, f"{html_file} missing <ul class='navbar'>"
        link_classes = {cls for a in navbar.find_all('a') for cls in (a.get('class') or [])}
        for expected in expected_classes:
            assert expected in link_classes, f"{html_file} missing link class {expected}"


def test_zx_calculus_online_project():
    with open('projects.html', 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')

    project = soup.find('section', id='zx-calculus-online')
    assert project is not None
    assert project.find('h2').get_text(strip=True) == 'ZX Calculus Online'

    grant_link = project.find(
        'a',
        href='https://unitary.foundation/grants/2026_zx_calculus_online/',
    )
    assert grant_link is not None


def test_current_stabilizer_paper_title():
    with open('publications.html', 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')

    paper_link = soup.find('a', href='https://arxiv.org/abs/2606.12383')
    assert paper_link is not None
    assert 'Minimality of the Stabilizer ZX Calculus' in paper_link.parent.get_text()
