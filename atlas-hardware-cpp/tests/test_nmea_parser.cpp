#include <gtest/gtest.h>
#include "atlas_hardware/Protocol/NMEAParser.h"

using namespace atlas;

TEST(NMEAParserTest, ParsesGGASentence) {
  NMEAParser parser;
  auto fix = parser.parseSentence(
    "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47");
  ASSERT_TRUE(fix.has_value());
  EXPECT_NEAR(fix->latitude, 48.1173, 0.001);
  EXPECT_NEAR(fix->longitude, 11.5167, 0.001);
  EXPECT_NEAR(fix->altitude, 545.4, 0.1);
  EXPECT_EQ(fix->satellites, 8);
  EXPECT_NEAR(fix->hdop, 0.9, 0.01);
}

TEST(NMEAParserTest, ParsesRMCSentence) {
  NMEAParser parser;
  auto fix = parser.parseSentence(
    "$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A");
  ASSERT_TRUE(fix.has_value());
  EXPECT_NEAR(fix->latitude, 48.1173, 0.001);
  EXPECT_NEAR(fix->speedKnots, 22.4, 0.1);
  EXPECT_NEAR(fix->course, 84.4, 0.1);
}

TEST(NMEAParserTest, IgnoresInvalidSentences) {
  NMEAParser parser;
  EXPECT_FALSE(parser.parseSentence("not nmea").has_value());
  EXPECT_FALSE(parser.parseSentence("$GPRMC,123519,V,,,,,,,*47").has_value());
}

TEST(NMEAParserTest, ParsesChunkedInput) {
  NMEAParser parser;
  auto fixes = parser.parseChunk(
    "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47\n");
  ASSERT_EQ(fixes.size(), 1);
  EXPECT_NEAR(fixes[0].latitude, 48.1173, 0.001);

  // Multiple sentences in one chunk
  fixes = parser.parseChunk(
    "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47\n"
    "$GPGGA,123520,4807.038,S,01131.000,W,1,06,1.2,100.0,M,,*48\n");
  ASSERT_EQ(fixes.size(), 2);
  EXPECT_NEAR(fixes[1].latitude, -48.1173, 0.001);
}

TEST(NMEAParserTest, HandlesEmptyChunk) {
  NMEAParser parser;
  auto fixes = parser.parseChunk("");
  EXPECT_TRUE(fixes.empty());
}

TEST(NMEAParserTest, HandlesPartialLineWithoutNewline) {
  NMEAParser parser;
  auto fixes = parser.parseChunk("$GPGGA,123519,4807.038,N,01131.000,E");
  EXPECT_TRUE(fixes.empty());
}
