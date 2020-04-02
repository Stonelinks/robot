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
#include "ui.h"
#include "net.h"

void startCameraServer();
char buff[128];

void setup() {

  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

  if (I2C_SDA > 0)
    Wire.begin(I2C_SDA, I2C_SCL);

  initUI();

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
    uiDrawString(0, 0, "Camera init Fail");
    while (1)
      ;
  }

  // drop down frame size for higher initial frame rate
  sensor_t *s = esp_camera_sensor_get();
  s->set_framesize(s, FRAMESIZE_QVGA);

  connectToWifi();

  // Port defaults to 8266
  ArduinoOTA.setPort(8269);

  // ArduinoOTA.setHostname(device_name);

  // No authentication by default
  // ArduinoOTA.setPassword((const char *)"123");

  ArduinoOTA.onStart([]() { uiDrawString(0, 0, "OTA: Start"); });
  ArduinoOTA.onEnd([]() { uiDrawString(0, 0, "OTA: End"); });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    uiDrawString("OTA Progress: %u%%\r", (progress / (total / 100)));
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
