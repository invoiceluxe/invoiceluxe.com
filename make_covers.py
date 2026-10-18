#!/usr/bin/env python3
"""Generates 1200x630 blog cover images for new articles (run: python3 make_covers.py)."""
from PIL import Image, ImageDraw, ImageFont
import os, textwrap
R=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.join(R,'images','blog')
B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; N='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
GOLD=(255,211,66); WHITE=(255,255,255); MUTE=(228,224,210)
C=[ # slug, kicker, title, big, sub, pill
('how-to-send-an-invoice-to-a-customer','INVOICING GUIDE','How to Send an Invoice to a Customer','PDF + email','Clear subject · due date · follow-up','Invoice Generator'),
('how-to-send-a-quote-or-estimate','QUOTES GUIDE','How to Send a Quote to a Customer','£780','£650 + 20% VAT · valid 14 days','Quote Generator'),
('vat-calculation-mistakes','VAT GUIDE','7 VAT Calculation Mistakes','120 ÷ 1.20','= 100, not 96','VAT Calculator'),
('how-to-calculate-percentage-of-a-number','PERCENTAGE GUIDE','How to Calculate a Percentage of a Number','15% of 240 = 36','number × percent ÷ 100','Percentage Calculator'),
('percentage-increase-and-decrease','PERCENTAGE GUIDE','Percentage Increase and Decrease','80 → 100 = +25%','(new − old) ÷ old × 100','Percentage Calculator'),
('discount-mistakes-to-avoid','DISCOUNT GUIDE','6 Discount Mistakes That Cost You Money','20% + 10% = 28%','not 30% when stacked','Discount Calculator'),
('profit-margin-formula','PRICING GUIDE','Profit Margin Formula','40% margin','price 100 · cost 60 · markup 66.7%','Profit Margin Calculator'),
('freelance-hourly-rate','FREELANCE GUIDE','How to Calculate Your Freelance Hourly Rate','≈ 49 / hour','54,000 ÷ 1,104 billable hours','Hourly Rate Calculator'),
('how-to-write-a-receipt','RECEIPTS GUIDE','How to Write a Receipt','Paid in full','number · date · items · method','Receipt Generator'),
('quote-vs-estimate-vs-invoice','QUOTES GUIDE','Quote vs Estimate vs Invoice','Offer → Work → Pay','know which document to send','Quote Generator'),
('late-payment-fees-and-interest','GETTING PAID','Late Payment Fees and Interest','£13.15','2,000 · 8% · 30 days late','Late Payment Calculator'),
('find-vat-rate-from-net-and-gross','VAT GUIDE','Find the VAT Rate From Net and Gross','80 → 96 = 20%','(gross − net) ÷ net × 100','VAT Calculator'),
('invoice-mistakes-to-avoid','INVOICING GUIDE','10 Invoice Mistakes That Delay Payment','✔ Checklist','number · due date · totals · PO','Invoice Generator'),
('convert-miles-to-km-and-other-units','CONVERSIONS','Miles to km, kg to lbs, °C to °F','1 mile = 1.609 km','× 2.205 kg→lb · ×9/5+32 °C→°F','Unit Converter'),
('loan-payment-emi-formula','FINANCE GUIDE','Loan EMI Formula','888.49 / month','10,000 · 12% · 12 months','Loan EMI Calculator'),
]
def f(p,s): return ImageFont.truetype(p,s)
mark=Image.open(os.path.join(R,'logo-mark.png')).convert('RGBA').resize((48,48),Image.LANCZOS)
for slug,kick,title,big,sub,pill in C:
    im=Image.new('RGB',(1200,630),(13,12,9)); d=ImageDraw.Draw(im)
    for y in range(630):  # subtle vertical gradient
        t=y/630; d.line([(0,y),(1200,y)],fill=(int(18-6*t),int(15-5*t),int(8-2*t)))
    im.paste(mark,(56,52),mark); d.text((116,76),'INVOICE LUXE',font=f(B,22),fill=WHITE,anchor='lm')
    d.text((56,158),kick,font=f(B,22),fill=GOLD)
    tsz=58
    def wrap(sz):
        fo=f(B,sz); lines=[]; cur=''
        for w in title.split():
            t=(cur+' '+w).strip()
            if d.textlength(t,font=fo)<=610: cur=t
            else: lines.append(cur); cur=w
        lines.append(cur); return lines
    lines=wrap(tsz)
    while len(lines)>3 and tsz>38: tsz-=4; lines=wrap(tsz)
    y=200
    for line in lines:
        d.text((56,y),line,font=f(B,tsz),fill=WHITE); y+=int(tsz*1.17)
    # right card
    d.rounded_rectangle((714,120,1144,510),radius=34,fill=(36,30,12),outline=(201,154,58),width=2)
    size=50
    while d.textlength(big,font=f(B,size))>380 and size>26: size-=2
    d.text((929,285),big,font=f(B,size),fill=GOLD,anchor='mm')
    sz=22
    while d.textlength(sub,font=f(N,sz))>380 and sz>15: sz-=1
    d.text((929,352),sub,font=f(N,sz),fill=MUTE,anchor='mm')
    pf=f(B,26); w=d.textlength(pill,font=pf)+48
    d.rounded_rectangle((56,530,56+w,578),radius=24,fill=GOLD); d.text((56+24,554),pill,font=pf,fill=(20,16,0),anchor='lm')
    im.save(os.path.join(OUT,slug+'.jpg'),quality=88,optimize=True)
print('covers:',len(C))
