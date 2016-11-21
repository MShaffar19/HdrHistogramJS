import "core-js"
import { expect } from "chai";
import { AbstractHistogram } from "./AbstractHistogram" 
import Int32Histogram from "./Int32Histogram"
import PercentileIterator from "./PercentileIterator"
import HistogramIterationValue from "./HistogramIterationValue"



class HistogramForTests extends AbstractHistogram {

  //constructor() {}

  incrementCountAtIndex(index: number): void {
  }

  setNormalizingIndexOffset(normalizingIndexOffset: number): void {
  }

  incrementTotalCount(): void {
  }

  resize(newHighestTrackableValue: number): void {
    this.establishSize(newHighestTrackableValue);
  }

  addToCountAtIndex(index: number, value: number): void {
  }

  getTotalCount() {
    return 0;
  }

  getCountAtIndex(index: number): number  {
    return 0;
  }

  protected _getEstimatedFootprintInBytes() {
    return 42;
  }

}

describe('Histogram initialization', () => {
  
  const histogram = new HistogramForTests(1, Number.MAX_SAFE_INTEGER, 3);

  it("should set sub bucket size", () => {
    expect(histogram.subBucketCount).to.be.equal(2048);
  })

  it("should set resize to false when max value specified", () => {
    expect(histogram.autoResize).to.be.false;
  })

  it("should compute counts array length", () => {
    expect(histogram.countsArrayLength).to.be.equal(45056);
  })

  it("should compute bucket count", () => {
    expect(histogram.bucketCount).to.be.equal(43);
  })

  it("should set min non zero value", () => {
    expect(histogram.minNonZeroValue).to.be.equal(Number.MAX_SAFE_INTEGER);
  })

  it("should set max value", () => {
    expect(histogram.maxValue).to.be.equal(0);
  })

});

describe('Histogram recording values', () => {

  it("should compute count index when value in first bucket", () => {
    // given
    const histogram = new HistogramForTests(1, Number.MAX_SAFE_INTEGER, 3);
    // when
    const index = histogram.countsArrayIndex(2000); // 2000 < 2048
    expect(index).to.be.equal(2000);
  })

  it("should compute count index when value outside first bucket", () => {
    // given
    const histogram = new HistogramForTests(1, Number.MAX_SAFE_INTEGER, 3);
    // when
    const index = histogram.countsArrayIndex(2050); // 2050 > 2048
    // then
    expect(index).to.be.equal(2049);
  })

  it("should compute count index when value outside second bucket 2", () => {
    // given
    const histogram = new HistogramForTests(1, Number.MAX_SAFE_INTEGER, 3);
    // when
    const index = histogram.countsArrayIndex(123456); 
    // then
    expect(index).to.be.equal(8073);
    
  })

  it("should update min non zero value", () => {
    // given
    const histogram = new HistogramForTests(1, Number.MAX_SAFE_INTEGER, 3);
    // when
    histogram.recordValue(123); 
    // then
    expect(histogram.minNonZeroValue).to.be.equal(123);
    
  })

  it("should update max value", () => {
    // given
    const histogram = new HistogramForTests(1, Number.MAX_SAFE_INTEGER, 3);
    // when
    histogram.recordValue(123); 
    // then
    expect(histogram.maxValue).to.be.equal(123);
    
  })

  it("should throw an error when value bigger than highest trackable value", () => {
    // given
    const histogram = new HistogramForTests(1, 4096, 3);
    // when then
    expect(() => histogram.recordValue(9000)).to.throw();   
  })

  it("should not throw an error when autoresize enable and value bigger than highest trackable value", () => {
    // given
    const histogram = new HistogramForTests(1, 4096, 3);
    histogram.autoResize = true;
    // when then
    expect(() => histogram.recordValue(9000)).to.not.throw();   
  })

  it("should increase counts array size when recording value bigger than highest trackable value", () => {
    // given
    const histogram = new HistogramForTests(1, 4096, 3);
    histogram.autoResize = true;
    // when
    histogram.recordValue(9000);
    // then
    expect(histogram.highestTrackableValue).to.be.greaterThan(9000);   
  })

/*
  it("should bench", () => {
    const histogram = new HistogramForTests(1, Number.MAX_SAFE_INTEGER, 3);
    for (var i = 0; i < 1000; i++) {
       histogram.recordValue(Math.floor(Math.random() * 100000));
    }
    const start = new Date().getTime();
    const nbLoop = 100000;
    for (var i = 0; i < nbLoop; i++) {
       histogram.recordValue(Math.floor(Math.random() * 100000));
    }
    const end = new Date().getTime();
    console.log("avg", (end - start)/nbLoop );

  }) 
*/
});

describe('Histogram computing statistics', () => {

  it("should compute mean value", () => {
    // given
    const histogram = new Int32Histogram(1, Number.MAX_SAFE_INTEGER, 3);
    // when
    histogram.recordValue(25);
    histogram.recordValue(50);
    histogram.recordValue(75);
    // then
    expect(histogram.getMean()).to.be.equal(50);
  });

  it("should compute standard deviation", () => {
    // given
    const histogram = new Int32Histogram(1, Number.MAX_SAFE_INTEGER, 3);
    // when
    histogram.recordValue(25);
    histogram.recordValue(50);
    histogram.recordValue(75);
    // then
    expect(histogram.getStdDeviation()).to.be.greaterThan(20.4124)
    expect(histogram.getStdDeviation()).to.be.below(20.4125)
  });

  it("should compute percentile distribution", () => {
    // given
    const histogram = new Int32Histogram(1, Number.MAX_SAFE_INTEGER, 3);
    // when
    histogram.recordValue(25);
    histogram.recordValue(50);
    histogram.recordValue(75);
    // then
    const expectedResult = (
`       Value     Percentile TotalCount 1/(1-Percentile)

      25.000 0.000000000000          1           1.00
      25.000 0.100000000000          1           1.11
      25.000 0.200000000000          1           1.25
      25.000 0.300000000000          1           1.43
      50.000 0.400000000000          2           1.67
      50.000 0.500000000000          2           2.00
      50.000 0.550000000000          2           2.22
      50.000 0.600000000000          2           2.50
      50.000 0.650000000000          2           2.86
      75.000 0.700000000000          3           3.33
      75.000 1.000000000000          3
#[Mean    =       50.000, StdDeviation   =       20.412]
#[Max     =       75.000, Total count    =            3]
#[Buckets =           43, SubBuckets     =         2048]
`
    );
    expect(histogram.outputPercentileDistribution()).to.be.equal(expectedResult);
  });

  it("should compute percentile distribution in csv format", () => {
    // given
    const histogram = new Int32Histogram(1, Number.MAX_SAFE_INTEGER, 3);
    // when
    histogram.recordValue(25);
    histogram.recordValue(50);
    histogram.recordValue(75);
    // then
    const expectedResult = (
`"Value","Percentile","TotalCount","1/(1-Percentile)"
25.000,0.000000000000,1,1.00
25.000,0.100000000000,1,1.11
25.000,0.200000000000,1,1.25
25.000,0.300000000000,1,1.43
50.000,0.400000000000,2,1.67
50.000,0.500000000000,2,2.00
50.000,0.550000000000,2,2.22
50.000,0.600000000000,2,2.50
50.000,0.650000000000,2,2.86
75.000,0.700000000000,3,3.33
75.000,1.000000000000,3,Infinity
`
    );
    expect(histogram.outputPercentileDistribution(undefined,undefined,true)).to.be.equal(expectedResult);
  });

});
