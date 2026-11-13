import math
import subprocess

FONT = "Liberation Sans, Arial, sans-serif"


class Diagram:
    def __init__(self, w, h, title=None, sub=None):
        self.w, self.h = w, h
        self.lines = []
        self.shapes = []
        self.labels = []
        self.title, self.sub = title, sub
        self.pos = {}

    def _tw(self, s, size):
        return len(s) * size * 0.56

    def entity(self, key, x, y, name, weak=False, w=None):
        w = w or max(130, self._tw(name, 15) + 40)
        h = 44
        self.pos[key] = ("rect", x, y, w / 2, h / 2)
        s = f'<rect x="{x-w/2}" y="{y-h/2}" width="{w}" height="{h}" fill="#d9d9d9" stroke="#111" stroke-width="1.5"/>'
        if weak:
            s += f'<rect x="{x-w/2+5}" y="{y-h/2+5}" width="{w-10}" height="{h-10}" fill="none" stroke="#111" stroke-width="1.4"/>'
        s += f'<text x="{x}" y="{y+5.5}" text-anchor="middle" font-size="15" font-weight="400">{name}</text>'
        self.shapes.append(s)

    def rel(self, key, x, y, name, ident=False, w=None):
        w = w or max(110, self._tw(name, 13) + 56)
        h = 56
        self.pos[key] = ("diamond", x, y, w / 2, h / 2)
        pts = f"{x-w/2},{y} {x},{y-h/2} {x+w/2},{y} {x},{y+h/2}"
        s = f'<polygon points="{pts}" fill="#d9d9d9" stroke="#111" stroke-width="1.5"/>'
        if ident:
            iw, ih = w / 2 - 9, h / 2 - 6
            s += f'<polygon points="{x-iw},{y} {x},{y-ih} {x+iw},{y} {x},{y+ih}" fill="none" stroke="#111" stroke-width="1.3"/>'
        s += f'<text x="{x}" y="{y+4.5}" text-anchor="middle" font-size="12.5" font-weight="400">{name}</text>'
        self.shapes.append(s)

    def attr(self, key, x, y, name, kind="", owner=None, rx=None):
        rx = rx or max(38, self._tw(name, 13) / 2 + 14)
        ry = 17
        self.pos[key] = ("ellipse", x, y, rx, ry)
        dash = ' stroke-dasharray="5 3"' if kind == "derived" else ""
        s = f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#fff" stroke="#111" stroke-width="1.4"{dash}/>'
        if kind == "multi":
            s += f'<ellipse cx="{x}" cy="{y}" rx="{rx-4}" ry="{ry-4}" fill="none" stroke="#111" stroke-width="1.1"/>'
        s += f'<text x="{x}" y="{y+4.5}" text-anchor="middle" font-size="13">{name}</text>'
        tw = self._tw(name, 13)
        if kind == "key":
            s += f'<line x1="{x-tw/2}" y1="{y+7}" x2="{x+tw/2}" y2="{y+7}" stroke="#111" stroke-width="1.2"/>'
        if kind == "partial":
            s += f'<line x1="{x-tw/2}" y1="{y+7}" x2="{x+tw/2}" y2="{y+7}" stroke="#111" stroke-width="1.2" stroke-dasharray="4 2.5"/>'
        self.shapes.append(s)
        if owner:
            self.link(owner, key)

    def _center(self, k):
        return self.pos[k][1], self.pos[k][2]

    def link(self, a, b, total=False, via=None):
        ax, ay = self._center(a)
        bx, by = self._center(b)
        pts = [(ax, ay)] + (via or []) + [(bx, by)]
        d = "M" + " L".join(f"{px},{py}" for px, py in pts)
        if total:
            self.lines.append(f'<path d="{d}" fill="none" stroke="#111" stroke-width="5.2"/>')
            self.lines.append(f'<path d="{d}" fill="none" stroke="#fff" stroke-width="2"/>')
        else:
            self.lines.append(f'<path d="{d}" fill="none" stroke="#111" stroke-width="1.4"/>')

    def text(self, x, y, s, size=13, weight=400, anchor="middle", color="#111", italic=False):
        st = ' font-style="italic"' if italic else ""
        self.labels.append(f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-size="{size}" font-weight="{weight}" fill="{color}"{st}>{s}</text>')

    def card(self, x, y, s, color="#111"):
        self.labels.append(f'<text x="{x}" y="{y}" text-anchor="middle" font-size="14" font-weight="400" fill="{color}">{s}</text>')

    def svg(self):
        head = f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}" font-family="{FONT}" fill="#111">'
        bg = f'<rect width="{self.w}" height="{self.h}" fill="#fff"/>'
        t = ""
        if self.title:
            t += f'<text x="24" y="36" font-size="20" font-weight="700">{self.title}</text>'
        if self.sub:
            t += f'<text x="24" y="60" font-size="13.5" fill="#555">{self.sub}</text>'
        return head + bg + t + "".join(self.lines) + "".join(self.shapes) + "".join(self.labels) + "</svg>"

    def save(self, name, scale=2):
        open(f"{name}.svg", "w").write(self.svg())
        subprocess.run(["rsvg-convert", "-z", str(scale), "-o", f"{name}.png", f"{name}.svg"], check=True)
