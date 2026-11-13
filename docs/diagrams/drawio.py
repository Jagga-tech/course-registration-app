import re
from xml.sax.saxutils import escape

PAGES = []


class Labels(list):
    def __init__(self, diagram):
        super().__init__()
        self.d = diagram

    def append(self, s):
        m = re.search(r'<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"', s)
        if m:
            x, y, w, h = map(float, m.groups())
            self.d._cell("", x, y, w, h, "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#999999;", back=True)


class Diagram:
    def __init__(self, w, h, title=None, sub=None):
        self.w, self.h = w, h
        self.cells = []
        self.back = []
        self.edges = []
        self.n = 0
        self.ids = {}
        self.labels = Labels(self)
        if title:
            self._cell(title, 24, 16, 900, 30, "text;html=1;fontSize=20;fontStyle=1;align=left;verticalAlign=middle;")
        if sub:
            self._cell(sub, 24, 46, 900, 22, "text;html=1;fontSize=13;fontColor=#555555;align=left;verticalAlign=middle;")

    def _id(self):
        self.n += 1
        return f"c{self.n}"

    def _cell(self, value, x, y, w, h, style, key=None, back=False):
        cid = self._id()
        if key:
            self.ids[key] = cid
        xml = (f'<mxCell id="{cid}" value="{escape(value, {chr(34): "&quot;"})}" style="{style}" vertex="1" parent="1">'
               f'<mxGeometry x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" as="geometry"/></mxCell>')
        (self.back if back else self.cells).append(xml)
        return cid

    def _tw(self, s, size):
        return len(s) * size * 0.56

    def entity(self, key, x, y, name, weak=False, w=None):
        w = w or max(130, self._tw(name, 15) + 40)
        h = 44
        st = "shape=ext;double=1;" if weak else ""
        self._cell(name, x - w / 2, y - h / 2, w, h,
                   st + "rounded=0;whiteSpace=wrap;html=1;fontSize=15;fontStyle=0;strokeWidth=1.5;fillColor=#d9d9d9;", key)

    def rel(self, key, x, y, name, ident=False, w=None):
        w = w or max(110, self._tw(name, 13) + 56)
        h = 56
        st = "shape=rhombus;double=1;" if ident else "rhombus;"
        self._cell(name, x - w / 2, y - h / 2, w, h,
                   st + "whiteSpace=wrap;html=1;fontSize=12;fontStyle=0;strokeWidth=1.5;fillColor=#d9d9d9;perimeter=rhombusPerimeter;", key)

    def attr(self, key, x, y, name, kind="", owner=None, rx=None):
        rx = rx or max(38, self._tw(name, 13) / 2 + 14)
        ry = 17
        st = "ellipse;whiteSpace=wrap;html=1;fontSize=13;fillColor=#ffffff;"
        value = name
        if kind == "key":
            st += "fontStyle=4;"
        elif kind == "partial":
            value = f'<span style="border-bottom:1.5px dashed #111;">{name}</span>'
        elif kind == "multi":
            st = "ellipse;shape=doubleEllipse;whiteSpace=wrap;html=1;fontSize=13;fillColor=#ffffff;"
        elif kind == "derived":
            st += "dashed=1;"
        self._cell(value, x - rx, y - ry, 2 * rx, 2 * ry, st, key)
        if owner:
            self.link(owner, key)

    def link(self, a, b, total=False, via=None):
        cid = self._id()
        st = "endArrow=none;html=1;rounded=0;strokeWidth=1.4;"
        if total:
            st = "shape=link;html=1;rounded=0;endArrow=none;strokeWidth=1.2;width=4;"
        pts = ""
        if via:
            pts = '<Array as="points">' + "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in via) + "</Array>"
        self.edges.append(f'<mxCell id="{cid}" style="{st}" edge="1" parent="1" source="{self.ids[a]}" target="{self.ids[b]}">'
                          f'<mxGeometry relative="1" as="geometry">{pts}</mxGeometry></mxCell>')

    def text(self, x, y, s, size=13, weight=400, anchor="middle", color="#111", italic=False):
        w = self._tw(s, size) + 12
        fs = (1 if weight >= 600 else 0) + (2 if italic else 0)
        align = {"middle": "center", "start": "left", "end": "right"}[anchor]
        left = x - w / 2 if anchor == "middle" else (x if anchor == "start" else x - w)
        self._cell(s, left, y - size, w, size + 6,
                   f"text;html=1;fontSize={size};fontStyle={fs};fontColor={color};align={align};verticalAlign=middle;spacing=0;")

    def card(self, x, y, s, color="#111111"):
        if s:
            self._cell(s, x - 10, y - 16, 20, 20,
                       f"text;html=1;fontSize=14;fontStyle=0;fontColor={color};align=center;verticalAlign=middle;spacing=0;")

    def save(self, name, scale=2):
        body = "".join(self.back) + "".join(self.edges) + "".join(self.cells)
        PAGES.append((name, self.w, self.h, body))


def write(path, names):
    out = ['<mxfile host="app.diagrams.net">']
    for i, (name, w, h, body) in enumerate(PAGES):
        out.append(f'<diagram id="p{i}" name="{names.get(name, name)}"><mxGraphModel dx="{w}" dy="{h}" grid="1" gridSize="10" '
                   f'guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{w}" pageHeight="{h}" '
                   f'math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>{body}</root></mxGraphModel></diagram>')
    out.append("</mxfile>")
    open(path, "w").write("".join(out))
