import b from "benny";
import { build } from "../index";
import { BINARY } from "../generated-wasm";
const loader = require("@assemblyscript/loader");
const base64 = require("base64-js");

const wasm = loader.instantiateSync(base64.toByteArray(BINARY));

const randomInteger = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
const options = { initCount: 1000 };

b.suite(
  "Histogram data access",
  b.add(
    "Int32Histogram",
    () => {
      const histogram = build({ bitBucketSize: 32 });
      return () => {
        histogram.recordValue(randomInteger());
      };
    },
    options
  ),
  b.add(
    "PackedHistogram",
    () => {
      const histogram = build({ bitBucketSize: "packed" });
      return () => {
        histogram.recordValue(randomInteger());
      };
    },
    options
  ),
  b.add(
    "Float64Histogram",
    () => {
      const histogram = build({ bitBucketSize: 64 });
      return () => {
        histogram.recordValue(randomInteger());
      };
    },
    options
  ),
  b.add(
    "SparseArrayHistogram",
    () => {
      const histogram = build({ bitBucketSize: "sparse_array" });
      return () => {
        histogram.recordValue(randomInteger());
      };
    },
    options
  ),
  b.add(
    "Int32Histogram eager allocation",
    () => {
      const histogram = build({
        bitBucketSize: 32,
        highestTrackableValue: Number.MAX_SAFE_INTEGER,
      });
      return () => {
        histogram.recordValue(randomInteger());
      };
    },
    options
  ),
  b.add(
    "WASM Int32Histogram",
    () => {
      const histogram = new wasm.Histogram32(1, 2, 3);
      return () => {
        histogram.recordValue(randomInteger());
      };
    },
    options
  ),
  b.add(
    "Float64Histogram eager allocation",
    () => {
      const histogram = build({
        bitBucketSize: 64,
        highestTrackableValue: Number.MAX_SAFE_INTEGER,
      });
      return () => {
        histogram.recordValue(randomInteger());
      };
    },
    options
  ),
  b.complete(),
  b.save({ file: "data-access", format: "chart.html" })
);
