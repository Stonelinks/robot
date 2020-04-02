#include "stdint.h"

char *wifi_configs[][2] = {
    {"New England Clam Router", "santa please hit me"},
    {"samsara-2.4", "samsara525"},
    {"DoyleNet", "pooppoop"},
    {"samsara", "samsara525"},
};

char device_name[23];

String ip;
String ssid;

void initNet() {
  // Hostname
  uint64_t chipid = ESP.getEfuseMac(); // The chip ID is essentially its MAC
                                       // address(length: 6 bytes).
  uint16_t chip = (uint16_t)(chipid >> 32);
  snprintf(device_name, 23, "ldcam-%04X%08X", chip, (uint32_t)chipid);
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

      uiDrawString(0, -16, "Connecting" + message + "\nSSID: " +
                               (String)wifi_configs[curr_network_index][0]);

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
    uiDrawString(0, -10, "Not connected\nrestarting");
    ESP.restart();
  }

  ip = WiFi.localIP().toString();
  ssid = WiFi.SSID();
  uiDrawString(0, 0, "WiFi connected");
}