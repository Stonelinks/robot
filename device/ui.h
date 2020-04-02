#include "config.h"
#include "net.h"

EventGroupHandle_t evGroup;

SSD1306 oled(SSD1306_ADDRESS, I2C_SDA, I2C_SCL, SSD130_MODLE_TYPE);
OLEDDisplayUi ui(&oled);

int x;
int y;

#ifdef ENABLE_BUTTON
OneButton button1(BUTTON_1, true);
#endif

void buttonClick() {
  static bool en = false;
  xEventGroupClearBits(evGroup, 1);
  sensor_t *s = esp_camera_sensor_get();
  en = en ? 0 : 1;
  s->set_vflip(s, en);
  delay(200);
  xEventGroupSetBits(evGroup, 1);
}

void buttonLongPress() {
  int x = oled.getWidth() / 2;
  int y = oled.getHeight() / 2;
  ui.disableAutoTransition();
  oled.setTextAlignment(TEXT_ALIGN_CENTER);
  oled.setFont(ArialMT_Plain_10);
  oled.clear();
}

void drawFrame0(OLEDDisplay *display, OLEDDisplayUiState *state, int16_t x,
                int16_t y) {
  display->setTextAlignment(TEXT_ALIGN_CENTER);
  display->setFont(ArialMT_Plain_10);
  display->drawString(64 + x, y, device_name);
}

void drawFrame1(OLEDDisplay *display, OLEDDisplayUiState *state, int16_t x,
                int16_t y) {
  display->setTextAlignment(TEXT_ALIGN_CENTER);

  int y1 = 25;

  if (oled.getHeight() == 32) {
    y1 = 10;
  }

  display->setFont(ArialMT_Plain_16);
  display->drawString(64 + x, y1 + y, ip);
  display->drawString(64 + x, 5 + y, ssid);
}

// void drawFrame2(OLEDDisplay *display, OLEDDisplayUiState *state, int16_t x,
//                 int16_t y) {
//   display->setTextAlignment(TEXT_ALIGN_CENTER);
//   display->setFont(ArialMT_Plain_10);

//   if (oled.getHeight() == 32) {
//     display->drawString(64 + x, 0 + y, "Camera Ready! Use");
//     display->drawString(64 + x, 10 + y, "http://" + ip);
//     display->drawString(64 + x, 16 + y, "to connect");
//   } else {
//     display->drawString(64 + x, 5 + y, "Camera Ready! Use");
//     display->drawString(64 + x, 25 + y, "http://" + ip);
//     display->drawString(64 + x, 45 + y, "to connect");
//   }
// }

// FrameCallback frames[] = {drawFrame0, drawFrame1, drawFrame2};
FrameCallback frames[] = {drawFrame0, drawFrame1};
#define FRAMES_SIZE (sizeof(frames) / sizeof(frames[0]))

void initUI() {
  oled.init();
  x = oled.getWidth() / 2;
  y = oled.getHeight() / 2;
  // Wire.setClock(100000);  //! Reduce the speed and prevent the speed from
  // being too high, causing the screen
  oled.setFont(ArialMT_Plain_16);
  oled.setTextAlignment(TEXT_ALIGN_CENTER);
  delay(50);
  oled.drawString(x, y - 10, device_name);
  oled.display();

  if (!(evGroup = xEventGroupCreate())) {
    Serial.println("evGroup Fail");
    while (1)
      ;
  }
  xEventGroupSetBits(evGroup, 1);

#ifdef ENABLE_BUTTON
  button1.attachLongPressStart(buttonLongPress);
  button1.attachClick(buttonClick);
#endif

  oled.setFont(ArialMT_Plain_16);

  ui.setTargetFPS(30);
  ui.setIndicatorPosition(BOTTOM);
  ui.setIndicatorDirection(LEFT_RIGHT);
  ui.setFrameAnimation(SLIDE_LEFT);
  ui.setFrames(frames, FRAMES_SIZE);
  ui.setTimePerFrame(6000);
}

void uiDrawString(int x_offset, int y_offset, String message) {
  oled.clear();
  oled.drawString(x + x_offset, y + y_offset, message);
  oled.display();
  Serial.println(message);
}
