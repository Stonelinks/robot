#include "esp_camera.h"
#include "esp_wifi.h"
#include "freertos/event_groups.h"
#include <ArduinoOTA.h>
#include <OneButton.h>
#include <WiFi.h>
#include <Wire.h>

#include "CRtspSession.h"
#include "OV2640.h"
#include "OV2640Streamer.h"

#define ENABLE_SLEEP
// #define ENABLE_IP5306

// motion sensor
// #define ENABLE_AS312
#define ENABLE_BUTTON

char *wifi_configs[][2] = {
    {"samsara-2.4", "samsara525"},
    {"DoyleNet", "pooppoop"},
    {"samsara", "samsara525"},
};

/***************************************
 *  PinOUT
 **************************************/
#define PWDN_GPIO_NUM 26
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 32
#define SIOD_GPIO_NUM 13
#define SIOC_GPIO_NUM 12

#define Y9_GPIO_NUM 39
#define Y8_GPIO_NUM 36
#define Y7_GPIO_NUM 23
#define Y6_GPIO_NUM 18
#define Y5_GPIO_NUM 15
#define Y4_GPIO_NUM 4
#define Y3_GPIO_NUM 14
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 27
#define HREF_GPIO_NUM 25
#define PCLK_GPIO_NUM 19
#define AS312_PIN 33
#define BUTTON_1 34

#define I2C_SDA 21
#define I2C_SCL 22

#define SSD130_MODLE_TYPE GEOMETRY_128_64

#include "OLEDDisplayUi.h"
#include "SSD1306.h"
#define SSD1306_ADDRESS 0x3c
SSD1306 oled(SSD1306_ADDRESS, I2C_SDA, I2C_SCL, SSD130_MODLE_TYPE);
OLEDDisplayUi ui(&oled);
int x;
int y;

char device_name[23];

String ip;
String ssid;
EventGroupHandle_t evGroup;

#ifdef ENABLE_BUTTON
OneButton button1(BUTTON_1, true);
#endif

#define IP5306_ADDR 0X75
#define IP5306_REG_SYS_CTL0 0x00

void startCameraServer();
char buff[128];

#ifdef ENABLE_IP5306
bool setPowerBoostKeepOn(int en) {
  Wire.beginTransmission(IP5306_ADDR);
  Wire.write(IP5306_REG_SYS_CTL0);
  if (en)
    Wire.write(0x37); // Set bit1: 1 enable 0 disable boost keep on
  else
    Wire.write(0x35); // 0x37 is default reg value
  return Wire.endTransmission() == 0;
}
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

#ifdef ENABLE_SLEEP
  if (PWDN_GPIO_NUM > 0) {
    pinMode(PWDN_GPIO_NUM, PULLUP);
    digitalWrite(PWDN_GPIO_NUM, HIGH);
  }
  oled.drawString(x, y, "Press again to wake up");
  oled.display();

  delay(6000);

  oled.clear();
  oled.display();
  oled.displayOff();

  // esp_sleep_enable_ext0_wakeup((gpio_num_t )BUTTON_1, LOW);
  esp_sleep_enable_ext1_wakeup(((uint64_t)(((uint64_t)1) << BUTTON_1)),
                               ESP_EXT1_WAKEUP_ALL_LOW);
  esp_deep_sleep_start();
#endif
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

#ifdef ENABLE_AS312
  if (digitalRead(AS312_PIN)) {
    display->drawString(64 + x, 5 + y, "AS312 Trigger");
  }
#endif
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

void setup() {

  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

  // Hostname
  uint64_t chipid = ESP.getEfuseMac(); // The chip ID is essentially its MAC
                                       // address(length: 6 bytes).
  uint16_t chip = (uint16_t)(chipid >> 32);
  snprintf(device_name, 23, "ldcam-%04X%08X", chip, (uint32_t)chipid);

#ifdef ENABLE_AS312
  pinMode(AS312_PIN, INPUT);
#endif
  if (I2C_SDA > 0)
    Wire.begin(I2C_SDA, I2C_SCL);

#ifdef ENABLE_IP5306
  bool isOk = setPowerBoostKeepOn(1);
  String info = "IP5306 KeepOn " + String((isOk ? "PASS" : "FAIL"));
#endif

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

#ifdef ENABLE_IP5306
  delay(1000);
  oled.setFont(ArialMT_Plain_10);
  oled.clear();
  oled.drawString(x, y - 10, info);
  oled.display();
  oled.setFont(ArialMT_Plain_16);
  delay(1000);
#endif

  if (!(evGroup = xEventGroupCreate())) {
    Serial.println("evGroup Fail");
    while (1)
      ;
  }
  xEventGroupSetBits(evGroup, 1);

#ifdef TTGO_T_CAMERA_MIC_V16
  /* IO13, IO14 is designed for JTAG by default,
   * to use it as generalized input,
   * firstly declair it as pullup input */
  pinMode(13, INPUT_PULLUP);
  pinMode(14, INPUT_PULLUP);
#endif

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  // init with high specs to pre-allocate larger buffers
  if (psramFound()) {
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init Fail");
    oled.clear();
    oled.drawString(x, y, "Camera init Fail");
    oled.display();
    while (1)
      ;
  }

  // drop down frame size for higher initial frame rate
  sensor_t *s = esp_camera_sensor_get();
  s->set_framesize(s, FRAMESIZE_QVGA);

#ifdef ENABLE_BUTTON
  button1.attachLongPressStart(buttonLongPress);
  button1.attachClick(buttonClick);
#endif

  oled.setFont(ArialMT_Plain_16);

  int tries = 0;
  int curr_network_index = 0;
  String message;
  while (curr_network_index < (sizeof(wifi_configs) / sizeof(*wifi_configs))) {
    WiFi.begin(wifi_configs[curr_network_index][0],
               wifi_configs[curr_network_index][1]);

    tries = 0;
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
      if (tries % 4 == 0) {
        message = "";
      } else if (tries % 4 == 1) {
        message = ".";
      } else if (tries % 4 == 2) {
        message = "..";
      } else if (tries % 4 == 3) {
        message = "...";
      }

      oled.clear();
      oled.drawString(x, y - 16,
                      "Connecting" + message + "\nSSID: " +
                          (String)wifi_configs[curr_network_index][0]);
      oled.display();

      if (tries > 20) {
        break;
      } else {
        tries++;
      }
    }

    if (WiFi.status() == WL_CONNECTED) {
      break;
    } else {

      curr_network_index++;
    }
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("");
    Serial.println("Not connected\nrestarting");

    oled.clear();
    oled.drawString(x, y - 10, "Not connected\nrestarting");
    oled.display();

    ESP.restart();
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  ip = WiFi.localIP().toString();
  ssid = WiFi.SSID();
  oled.clear();
  oled.drawString(x, y, "WiFi connected");
  oled.display();

  // Port defaults to 8266
  ArduinoOTA.setPort(8269);

  // ArduinoOTA.setHostname(device_name);

  // No authentication by default
  // ArduinoOTA.setPassword((const char *)"123");

  ArduinoOTA.onStart([]() {
    Serial.println("OTA: Start");

    oled.clear();
    oled.drawString(x, y, "OTA: Start");
    oled.display();
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("OTA: End");

    oled.clear();
    oled.drawString(x, y, "OTA: End");
    oled.display();
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("OTA Progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);

    oled.clear();

    if (error == OTA_AUTH_ERROR) {
      Serial.println("OTA: Auth Failed");
      oled.drawString(x, y, "OTA: Auth Failed");
    } else if (error == OTA_BEGIN_ERROR) {
      Serial.println("OTA: Begin Failed");
      oled.drawString(x, y, "OTA: Begin Failed");
    } else if (error == OTA_CONNECT_ERROR) {
      Serial.println("OTA: Connect Failed");
      oled.drawString(x, y, "OTA: Connect Failed");
    } else if (error == OTA_RECEIVE_ERROR) {
      Serial.println("OTA: Receive Failed");
      oled.drawString(x, y, "OTA: Receive Failed");
    } else if (error == OTA_END_ERROR) {
      Serial.println("OTA: End Failed");
      oled.drawString(x, y, "OTA: End Failed");

    } else {
      oled.drawString(x, y, "OTA: unknown error");
    }
    oled.display();
  });

  ArduinoOTA.begin();
  startCameraServer();

  delay(50);

  ui.setTargetFPS(30);
  ui.setIndicatorPosition(BOTTOM);
  ui.setIndicatorDirection(LEFT_RIGHT);
  ui.setFrameAnimation(SLIDE_LEFT);
  ui.setFrames(frames, FRAMES_SIZE);
  ui.setTimePerFrame(6000);

  Serial.print("Camera Ready! Use 'http://");
  Serial.print(ip);
  Serial.println("' to connect");
}

void loop() {
  if (ui.update()) {
#ifdef ENABLE_BUTTON
    button1.tick();
#else
    delay(500);
#endif
  }
  ArduinoOTA.handle();
}
