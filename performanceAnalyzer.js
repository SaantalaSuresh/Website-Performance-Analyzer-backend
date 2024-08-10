



const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function performanceAnalyzer(url) {
  let browser;
  try {
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

  
    await page.setCacheEnabled(false);

    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    await client.send('Performance.enable');

   
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 }); 

    
    const metrics = await client.send('Performance.getMetrics');


    let firstContentfulPaint = 0;
    let largestContentfulPaint = 0;
    let firstInputDelay = 0;
    let cumulativeLayoutShift = 0;

    
    metrics.metrics.forEach((metric) => {
      if (metric.name === 'FirstContentfulPaint') firstContentfulPaint = metric.value;
      if (metric.name === 'LargestContentfulPaint') largestContentfulPaint = metric.value;
      if (metric.name === 'FirstInputDelay') firstInputDelay = metric.value;
      if (metric.name === 'CumulativeLayoutShift') cumulativeLayoutShift = metric.value;
    });

    const performanceTiming = JSON.parse(await page.evaluate(() => JSON.stringify(performance.timing)));

    const navigationStart = performanceTiming.navigationStart;
    const responseEnd = performanceTiming.responseEnd;
    const domContentLoadedEventEnd = performanceTiming.domContentLoadedEventEnd;
    const loadEventEnd = performanceTiming.loadEventEnd;

    const timeToFirstByte = responseEnd - navigationStart;
    const domContentLoaded = domContentLoadedEventEnd - navigationStart;
    const pageLoadTime = loadEventEnd - navigationStart;

    const performanceEntries = JSON.parse(await page.evaluate(() => JSON.stringify(performance.getEntriesByType('resource'))));

    const totalRequestSize = performanceEntries.reduce((total, entry) => total + (entry.transferSize || 0), 0);
    const numberOfRequests = performanceEntries.length;

  
    const formData = {
      timestamp: metrics.metrics.find(metric => metric.name === 'Timestamp')?.value || 0,
      audioHandlers: metrics.metrics.find(metric => metric.name === 'AudioHandlers')?.value || 0,
      audioWorkletProcessors: metrics.metrics.find(metric => metric.name === 'AudioWorkletProcessors')?.value || 0,
      documents: metrics.metrics.find(metric => metric.name === 'Documents')?.value || 0,
      frames: metrics.metrics.find(metric => metric.name === 'Frames')?.value || 0,
      jsEventListeners: metrics.metrics.find(metric => metric.name === 'JSEventListeners')?.value || 0,
      layoutObjects: metrics.metrics.find(metric => metric.name === 'LayoutObjects')?.value || 0,
      mediaKeySessions: metrics.metrics.find(metric => metric.name === 'MediaKeySessions')?.value || 0,
      mediaKeys: metrics.metrics.find(metric => metric.name === 'MediaKeys')?.value || 0,
      nodes: metrics.metrics.find(metric => metric.name === 'Nodes')?.value || 0,
      resources: metrics.metrics.find(metric => metric.name === 'Resources')?.value || 0,
      contextLifecycleStateObservers: metrics.metrics.find(metric => metric.name === 'ContextLifecycleStateObservers')?.value || 0,
      v8PerContextDatas: metrics.metrics.find(metric => metric.name === 'V8PerContextDatas')?.value || 0,
      workerGlobalScopes: metrics.metrics.find(metric => metric.name === 'WorkerGlobalScopes')?.value || 0,
      uacssResources: metrics.metrics.find(metric => metric.name === 'UACSSResources')?.value || 0,
      rtcPeerConnections: metrics.metrics.find(metric => metric.name === 'RTCPeerConnections')?.value || 0,
      resourceFetchers: metrics.metrics.find(metric => metric.name === 'ResourceFetchers')?.value || 0,
      adSubframes: metrics.metrics.find(metric => metric.name === 'AdSubframes')?.value || 0,
      detachedScriptStates: metrics.metrics.find(metric => metric.name === 'DetachedScriptStates')?.value || 0,
      arrayBufferContents: metrics.metrics.find(metric => metric.name === 'ArrayBufferContents')?.value || 0,
      layoutCount: metrics.metrics.find(metric => metric.name === 'LayoutCount')?.value || 0,
      recalcStyleCount: metrics.metrics.find(metric => metric.name === 'RecalcStyleCount')?.value || 0,
      layoutDuration: metrics.metrics.find(metric => metric.name === 'LayoutDuration')?.value || 0,
      recalcStyleDuration: metrics.metrics.find(metric => metric.name === 'RecalcStyleDuration')?.value || 0,
      devToolsCommandDuration: metrics.metrics.find(metric => metric.name === 'DevToolsCommandDuration')?.value || 0,
      scriptDuration: metrics.metrics.find(metric => metric.name === 'ScriptDuration')?.value || 0,
      v8CompileDuration: metrics.metrics.find(metric => metric.name === 'V8CompileDuration')?.value || 0,
      taskDuration: metrics.metrics.find(metric => metric.name === 'TaskDuration')?.value || 0,
      taskOtherDuration: metrics.metrics.find(metric => metric.name === 'TaskOtherDuration')?.value || 0,
      threadTime: metrics.metrics.find(metric => metric.name === 'ThreadTime')?.value || 0,
      processTime: metrics.metrics.find(metric => metric.name === 'ProcessTime')?.value || 0,
      jsHeapUsedSize: metrics.metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value || 0,
      jsHeapTotalSize: metrics.metrics.find(metric => metric.name === 'JSHeapTotalSize')?.value || 0,
      firstMeaningfulPaint: metrics.metrics.find(metric => metric.name === 'FirstMeaningfulPaint')?.value || 0,
      domContentLoaded: domContentLoaded,
      navigationStart: navigationStart,
    };

    await browser.close();

    return {
      largestContentfulPaint: Math.round(largestContentfulPaint * 100) / 100,
      firstContentfulPaint: Math.round(firstContentfulPaint * 100) / 100,
      timeToFirstByte: Math.round(timeToFirstByte),
      firstInputDelay: Math.round(firstInputDelay),
      cumulativeLayoutShift: Math.round(cumulativeLayoutShift * 100) / 100,
      domContentLoaded: Math.round(domContentLoaded),
      pageLoadTime: Math.round(pageLoadTime),
      totalRequestSize: Math.round(totalRequestSize / 1024), 
      numberOfRequests,
      formData 
    };
  } catch (error) {
    console.error('Error during performance analysis:', error);
    throw error;
  } finally {
    
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = performanceAnalyzer;
