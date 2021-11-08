#define SSD130_MODLE_TYPE GEOMETRY_128_64
#define I2C_SDA 21
#define I2C_SCL 22
#include "OLEDDisplayUi.h"
#include "SSD1306.h"
#define SSD1306_ADDRESS 0x3c

// #define ENABLE_BUTTON
#define BUTTON_1 34

#define ENABLE_OTA
#define OTA_PORT 8269

#define ENABLE_WEBSERVER
#define WEBSERVER_PORT 80