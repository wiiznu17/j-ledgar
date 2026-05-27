package com.jledger.pos;

interface IPrinterService {
    /**
     * ดึงสถานะปัจจุบันของเครื่องพิมพ์ (0: พร้อมใช้งาน, 1: กระดาษหมด, 2: ร้อนเกินกำหนด)
     */
    int getPrinterStatus();

    /**
     * สั่งพิมพ์ข้อความตัวอักษรลงบนกระดาษความร้อน
     */
    void printText(String text);

    /**
     * สั่งพิมพ์รูปภาพโลโก้หรือบาร์โค้ดสลิปธุรกรรม
     */
    void printBitmap(in byte[] bitmapData);

    /**
     * สั่งตัดกระดาษสลิปความร้อน
     */
    void cutPaper();
}
