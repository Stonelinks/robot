#include "freertos/event_groups.h"
#include <ArduinoOTA.h>
#include <OneButton.h>
#include <WebServer.h>
#include <Wire.h>

#include <WebServer.h>
#include <WiFi.h>
#include <WiFiClient.h>

#include "OV2640.h"

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

OV2640 cam;

SSD1306 oled(SSD1306_ADDRESS, I2C_SDA, I2C_SCL, SSD130_MODLE_TYPE);
OLEDDisplayUi ui(&oled);

#ifdef ENABLE_BUTTON
bool en = false;
OneButton button1(BUTTON_1, true);
#endif

#ifdef ENABLE_WEBSERVER
WebServer server(WEBSERVER_PORT);
#endif

#ifdef ENABLE_WEBSERVER
void handle_jpg_stream(void) {
  WiFiClient client = server.client();
  String response = "HTTP/1.1 200 OK\r\n";
  response += "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n\r\n";
  server.sendContent(response);

  while (1) {
    cam.run();
    if (!client.connected())
      break;
    response = "--frame\r\n";
    response += "Content-Type: image/jpeg\r\n\r\n";
    server.sendContent(response);

    client.write((char *)cam.getfb(), cam.getSize());
    server.sendContent("\r\n");
    if (!client.connected())
      break;
  }
}

void handle_jpg(void) {
  WiFiClient client = server.client();

  cam.run();
  if (!client.connected()) {
    return;
  }
  String response = "HTTP/1.1 200 OK\r\n";
  response += "Content-disposition: inline; filename=capture.jpg\r\n";
  response += "Content-type: image/jpeg\r\n\r\n";
  server.sendContent(response);
  client.write((char *)cam.getfb(), cam.getSize());
}

void handleNotFound() {
  String message = "Server is running!\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  server.send(200, "text/plain", message);
}
#endif

void initNet() {
  connectToWifi();

  // Hostname
  uint64_t chipid = ESP.getEfuseMac(); // The chip ID is essentially its MAC
                                       // address(length: 6 bytes).
  uint16_t chip = (uint16_t)(chipid >> 32);
  sprintf(device_name, "ldcam-%04X%08X", chip, (uint32_t)chipid);

#ifdef ENABLE_WEBSERVER
  server.on("/mjpeg", HTTP_GET, handle_jpg_stream);
  server.on("/snapshot", HTTP_GET, handle_jpg);
  server.onNotFound(handleNotFound);
  server.begin();
#endif
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

// void startCameraServer();

void initOta() {
  // Port defaults to 8266
  ArduinoOTA.setPort(OTA_PORT);

  ArduinoOTA.setHostname(device_name);
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
}

void initCam() {
  camera_config_t config = esp32cam_ttgo_t_config;

  esp_err_t err = cam.init(config);
  if (err != ESP_OK) {
    uiDrawString(0, 0, "Camera init Fail");
    while (1)
      ;
  }

  sensor_t *s = esp_camera_sensor_get();
  s->set_vflip(s, 1);
}

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    ;
  }
  Serial.println();

  if (I2C_SDA > 0) {
    Wire.begin(I2C_SDA, I2C_SCL);
  }

  initUi();
  initCam();

  initNet();

#ifdef ENABLE_OTA
  initOta();
#endif

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

#ifdef ENABLE_OTA
  ArduinoOTA.handle();
#endif

#ifdef ENABLE_WEBSERVER
  server.handleClient();
#endif
}
