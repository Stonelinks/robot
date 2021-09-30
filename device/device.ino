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

#include "config.h"

char *wifi_configs[][2] = {
    {"Soonduburu", "santapleasehitme"},
    {"samsara-2.4", "samsara525"},
    {"samsara", "samsara525"},
};

char device_name[23];
char ota_progress[23];

String ip;
String ssid;

EventGroupHandle_t evGroup;

SSD1306 oled(SSD1306_ADDRESS, I2C_SDA, I2C_SCL, SSD130_MODLE_TYPE);
OLEDDisplayUi ui(&oled);

#ifdef ENABLE_BUTTON
bool en = false;
OneButton button1(BUTTON_1, true);
#endif

void initNet() {
  // Hostname
  uint64_t chipid = ESP.getEfuseMac(); // The chip ID is essentially its MAC
                                       // address(length: 6 bytes).
  uint16_t chip = (uint16_t)(chipid >> 32);
  sprintf(device_name, "ldcam-%04X%08X", chip, (uint32_t)chipid);
}

void connectToWifi() {

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

      uiDrawString(0, -30,
                   "Connecting to\n" +
                       (String)wifi_configs[curr_network_index][0] + "\n" +
                       message);

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
    uiDrawString(0, 0, "Not connected\nrestarting");
    ESP.restart();
  }

  ip = WiFi.localIP().toString();
  ssid = WiFi.SSID();
  uiDrawString(0, 0, "WiFi connected");
}

#ifdef ENABLE_BUTTON
void buttonClick() {
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
#endif

void drawFrame0(OLEDDisplay *display, OLEDDisplayUiState *state, int16_t x,
                int16_t y) {
  display->setTextAlignment(TEXT_ALIGN_CENTER);
  display->setFont(ArialMT_Plain_10);

  display->drawString(64 + x, 20 + y, device_name);
}

void drawFrame1(OLEDDisplay *display, OLEDDisplayUiState *state, int16_t x,
                int16_t y) {
  display->setTextAlignment(TEXT_ALIGN_CENTER);
  display->setFont(ArialMT_Plain_16);

  display->drawString(64 + x, 0 + y, ssid);
  display->drawString(64 + x, 16 + y, ip);
}

FrameCallback frames[] = {drawFrame0, drawFrame1};
#define FRAMES_SIZE (sizeof(frames) / sizeof(frames[0]))

void initUi() {
  oled.init();

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

  ui.setTargetFPS(15);
  ui.setIndicatorPosition(BOTTOM);
  ui.setIndicatorDirection(LEFT_RIGHT);
  ui.setFrameAnimation(SLIDE_LEFT);
  ui.setFrames(frames, FRAMES_SIZE);
  ui.setTimePerFrame(6000);
  ui.disableIndicator();
}

void uiDrawString(int x_offset, int y_offset, String message) {
  oled.clear();
  oled.setTextAlignment(TEXT_ALIGN_CENTER);
  oled.setFont(ArialMT_Plain_10);
  oled.drawString((oled.getWidth() / 2) + x_offset,
                  (oled.getHeight() / 2) + y_offset, message);
  oled.display();
  Serial.println(message);
}

void startCameraServer();

void setup() {
  // Serial.begin(115200);
  Serial.begin(9600);
  Serial.setDebugOutput(true);
  Serial.println();

  if (I2C_SDA > 0) {
    Wire.begin(I2C_SDA, I2C_SCL);
  }

  initUi();
  initNet();

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
  // if (psramFound()) {
  //   config.frame_size = FRAMESIZE_UXGA;
  //   config.jpeg_quality = 10;
  //   config.fb_count = 2;
  // } else {
  config.frame_size = FRAMESIZE_SVGA;
  config.jpeg_quality = 12;
  config.fb_count = 1;
  // }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    uiDrawString(0, 0, "Camera init Fail");
    while (1)
      ;
  }

  sensor_t *s = esp_camera_sensor_get();
  s->set_vflip(s, 1);

  connectToWifi();

  // Port defaults to 8266
  ArduinoOTA.setPort(8269);

  // ArduinoOTA.setHostname(device_name);

  // No authentication by default
  // ArduinoOTA.setPassword((const char *)"123");

  ArduinoOTA.onStart([]() { uiDrawString(0, 0, "OTA: Start"); });
  ArduinoOTA.onEnd([]() { uiDrawString(0, 0, "OTA: End"); });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    sprintf(ota_progress, "OTA Progress: %u%%\r", (progress / (total / 100)));
    uiDrawString(0, 0, ota_progress);
  });
  ArduinoOTA.onError([](ota_error_t error) {
    String msg = "";
    if (error == OTA_AUTH_ERROR) {
      msg = "OTA: Auth Failed";
    } else if (error == OTA_BEGIN_ERROR) {
      msg = "OTA: Begin Failed";
    } else if (error == OTA_CONNECT_ERROR) {
      msg = "OTA: Connect Failed";
    } else if (error == OTA_RECEIVE_ERROR) {
      msg = "OTA: Receive Failed";
    } else if (error == OTA_END_ERROR) {
      msg = "OTA: End Failed";
    } else {
      msg = "OTA: unknown error";
    }
    uiDrawString(0, 0, msg);
  });

  ArduinoOTA.begin();
  startCameraServer();

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
