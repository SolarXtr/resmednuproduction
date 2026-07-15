# MedNU Research Analytics Dashboard (iRAM)
**Faculty of Medicine, Naresuan University**

ระบบแดชบอร์ดติดตามและประเมินศักยภาพเชิงวิชาการ คัดกรองและประมวลผลงานวิจัยของคณาจารย์แพทย์ มหาวิทยาลัยนเรศวร

🌐 เว็บไซต์ใช้งานจริง: https://mednu-scopus-dashboard.pages.dev/

---

## 🚀 ฟังก์ชันหลักของระบบ (Main Features)
1.  **Overview Dashboard**: แสดงผลสถิติงานวิจัยแบบเกจวัด ยอดตีพิมพ์ ยอดสะสมการอ้างอิง h-index เฉลี่ย พร้อม **SciVal Highlights** (Geographical Collaboration, Subject Area, Top Topics)
2.  **Smart Deduplication & Ingestion (Scopus + PubMed)**: สคริปต์กวาดและหลอมรวมผลงานวิจัยข้ามค่าย ป้องกันบทความซ้ำซ้อนผ่านตัวเช็ค DOI และจับคู่รายชื่อผู้ร่วมแต่งวิจัยแบบระบุลำดับห้อยตัวเลขยก (Superscript)
3.  **Metrics Guide (Glossary)**: หน้าคู่มือการแปลความหมายคำศัพท์เชิงวิชาการระดับสูง (FWCI, H-index, Quartiles, SJR, CiteScore, SNIP, Prominence Percentile, Author Roles)
4.  **Admin Portal**: แบบฟอร์มเพิ่ม/แก้ไขข้อมูลบทความวิจัยที่มาจากฐานข้อมูลต่างๆ ได้แก่ Scopus, PubMed และ **Web of Science (WoS)**

---

## 📂 โครงสร้างแฟ้มข้อมูล (Folder Structure)
*   `/index.html` : หน้าจอแสดงผลแดชบอร์ดหลัก (Overview, Publications, Researchers)
*   `/scival.html` : หน้าสรุปผลสถิติและตัวชี้วัดบทวิเคราะห์ระดับสูงของ SciVal
*   `/glossary.html` : หน้าคู่มืออธิบายดัชนีคำศัพท์วิชาการและแนวทางการแปลสัญลักษณ์
*   `/about.html` : หน้ารวบรวมประวัติโครงการ ขั้นตอนพัฒนา และรายงานการแก้ปัญหาระบบ
*   `/admin.html` : หน้าต่างแบบฟอร์มบันทึกข้อมูลและแก้ไขรายละเอียดสำหรับผู้ดูแลระบบ
*   `/app.js` : ไฟล์ควบคุมการวิเคราะห์ พล็อตแผนภูมิรูปวงกลม/เส้นเชิงปริมาณ และกรองสถิติหน้าบ้าน
*   `/fetch_data.py` : สคริปต์หลักภาษา Python ในการ Sync และจัดการข้อมูลบทความข้ามฐานข้อมูล

---

## ☁️ การนำขึ้นระบบโฮสต์ออนไลน์ (Cloudflare Pages Setup)
ระบบนี้ทำงานในรูปแบบ **Static HTML/CSS/JS (SPA)** ร่วมกับฐานข้อมูลอัจฉริยะในตัว (`data.json`):
1.  เชื่อมต่อ GitHub Repository นี้กับโครงการ **Cloudflare Pages** ของคุณ
2.  ในการตั้งค่า Build Settings:
    *   **Framework preset**: เลือก `None`
    *   **Build command**: ปล่อยว่าง
    *   **Publish directory**: ปล่อยว่าง (ใช้โฟลเดอร์หลัก `/`)
3.  หลังจากทำ Git Push โค้ดระบบและสถิติชุดล่าสุด ระบบจะรันการบิลด์ใหม่และอัปเดตหน้า Dashboard ให้เสร็จสิ้นภายใน 15 วินาที
