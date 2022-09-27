// Copyright 2013 Google Inc. All Rights Reserved.
// You may study, modify, and use this example for any purpose.
// Note that this example is provided "as is", WITHOUT WARRANTY
// of any kind either expressed or implied.

let adsManager;
let adsLoader;
let adDisplayContainer;
let intervalTimer;
let playButton;
let videoContent;

/**
 * Initializes IMA setup.
 */
function init(adTagUrl) {
  videoContent = document.getElementById('contentElement');
  playButton = document.getElementById('playButton');
  setupPlayButton(playButton);
  setUpIMA(adTagUrl);
}
function setupPlayButton(button) {
  var modes = ['Play', 'Pause'];

  var mode = 0
  button.addEventListener('click', () => {
    var currMode = modes[mode];
    if (currMode == 'Play') {
      playAds();
    }
    // else {
    //   pauseAds();
    // }
    // mode = 1 - mode;
    // button.innerHTML = modes[mode];
  });
}

function pauseAds() {
  console.log('pausing...');
  videoContent.pause();
}
/**
 * Sets up IMA ad display container, ads loader, and makes an ad request.
 */
function setUpIMA(adTagUrl) {
  // Create the ad display container.
  createAdDisplayContainer();
  // Create ads loader.
  adsLoader = new google.ima.AdsLoader(adDisplayContainer);
  // Listen and respond to ads loaded and error events.
  adsLoader.addEventListener(
    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
    onAdsManagerLoaded, false);
  adsLoader.addEventListener(
    google.ima.AdErrorEvent.Type.AD_ERROR, onAdError, false);

  // An event listener to tell the SDK that our content video
  // is completed so the SDK can play any post-roll ads.
  const contentEndedListener = function () {
    adsLoader.contentComplete();
  };
  videoContent.onended = contentEndedListener;

  // Request video ads.
  const adsRequest = new google.ima.AdsRequest();
  adsRequest.adTagUrl = adTagUrl;

  // Specify the linear and nonlinear slot sizes. This helps the SDK to
  // select the correct creative if multiple are returned.
  adsRequest.linearAdSlotWidth = 640;
  adsRequest.linearAdSlotHeight = 400;

  adsRequest.nonLinearAdSlotWidth = 640;
  adsRequest.nonLinearAdSlotHeight = 150;

  adsLoader.requestAds(adsRequest);
}

/**
 * Sets the 'adContainer' div as the IMA ad display container.
 */
function createAdDisplayContainer() {
  // We assume the adContainer is the DOM id of the element that will house
  // the ads.
  adDisplayContainer = new google.ima.AdDisplayContainer(
    document.getElementById('adContainer'), videoContent);
}

/**
 * Loads the video content and initializes IMA ad playback.
 */
function playAds() {
  // Initialize the container. Must be done through a user action on mobile
  // devices.
  videoContent.load();
  adDisplayContainer.initialize();

  try {
    // Initialize the ads manager. Ad rules playlist will start at this time.
    adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
    // Call play to start showing the ad. Single video and overlay ads will
    // start at this time; the call will be ignored for ad rules.
    adsManager.start();
  } catch (adError) {
    // An error may be thrown if there was a problem with the VAST response.
    videoContent.play();
  }
}

/**
 * Handles the ad manager loading and sets ad event listeners.
 * @param {!google.ima.AdsManagerLoadedEvent} adsManagerLoadedEvent
 */
function onAdsManagerLoaded(adsManagerLoadedEvent) {
  // Get the ads manager.
  const adsRenderingSettings = new google.ima.AdsRenderingSettings();
  adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
  // videoContent should be set to the content video element.
  adsManager =
    adsManagerLoadedEvent.getAdsManager(videoContent, adsRenderingSettings);

  // Add listeners to the required events.
  adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
  adsManager.addEventListener(
    google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
  adsManager.addEventListener(
    google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
    onContentResumeRequested);
  adsManager.addEventListener(
    google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdEvent);

  // Listen to any additional events, if necessary.
  adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, onAdEvent);
  adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onAdEvent);
  adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdEvent);
}

/**
 * Handles actions taken in response to ad events.
 * @param {!google.ima.AdEvent} adEvent
 */
function onAdEvent(adEvent) {
  // Retrieve the ad from the event. Some events (for example,
  // ALL_ADS_COMPLETED) don't have ad object associated.
  const ad = adEvent.getAd();
  switch (adEvent.type) {
    case google.ima.AdEvent.Type.LOADED:
      // This is the first event sent for an ad - it is possible to
      // determine whether the ad is a video ad or an overlay.
      if (!ad.isLinear()) {
        // Position AdDisplayContainer correctly for overlay.
        // Use ad.width and ad.height.
        videoContent.play();
      }
      break;
    case google.ima.AdEvent.Type.STARTED:
      // This event indicates the ad has started - the video player
      // can adjust the UI, for example display a pause button and
      // remaining time.
      if (ad.isLinear()) {
        // For a linear ad, a timer can be started to poll for
        // the remaining time.
        intervalTimer = setInterval(
          function () {
            // Example: const remainingTime = adsManager.getRemainingTime();
          },
          300);  // every 300ms
      }
      break;
    case google.ima.AdEvent.Type.COMPLETE:
      // This event indicates the ad has finished - the video player
      // can perform appropriate UI actions, such as removing the timer for
      // remaining time detection.
      if (ad.isLinear()) {
        clearInterval(intervalTimer);
      }
      break;
  }
}

/**
 * Handles ad errors.
 * @param {!google.ima.AdErrorEvent} adErrorEvent
 */
function onAdError(adErrorEvent) {
  // Handle the error logging.
  const error = adErrorEvent.getError();
  const ctx = adErrorEvent.getUserRequestContext();
  if (error) {
    console.log('An IMA error of type ' + error.getType() + ' occured: #' + error.getErrorCode(), error.getMessage());
    if (ctx) {
      console.log('Error context:', ctx);
    }
  }

  try {
    adsManager.destroy();
  } catch (e) { }
}

/**
 * Pauses video content and sets up ad UI.
 */
function onContentPauseRequested() {
  videoContent.pause();
  // This function is where you should setup UI for showing ads (for example,
  // display ad timer countdown, disable seeking and more.)
  // setupUIForAds();
}

/**
 * Resumes video content and removes ad UI.
 */
function onContentResumeRequested() {
  videoContent.play();
  // This function is where you should ensure that your UI is ready
  // to play content. It is the responsibility of the Publisher to
  // implement this function when necessary.
  // setupUIForContent();
}

// Wire UI element references and UI event listeners.
// init(
//   [
//     'https://pubads.g.doubleclick.net/gampad/ads?iu=/31695560/video_01&description_url=https%3A%2F%2Frtbhouse.com&tfcd=0&npa=0&sz=400x300%7C640x480&cust_params=adformat%3Dvideo&min_ad_duration=&max_ad_duration=&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=&nofb=1&vad_type=linear',
//     'https://raw.githubusercontent.com/InteractiveAdvertisingBureau/VAST_Samples/master/VAST%201-2.0%20Samples/Inline_LinearRegular_VAST2.0.xml',

//     'https://pubads.g.doubleclick.net/gampad/ads?' +
//     'iu=/21775744923/external/single_ad_samples&sz=640x480&' +
//     'cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&' +
//     'output=vast&unviewed_position_start=1&env=vp&impl=s&correlator='
//   ][0]
// );
const PREBID_TIMEOUT = 3000;
var pbjs = pbjs || {};
pbjs.que = pbjs.que || [];
var invokeVideoPlayer = function (url) {
  // tempTag = url;
  init(url);
};
var videoAdUnit = {
  code: 'video_01',
  mediaTypes: {
    video: {
      context: 'instream',
      playerSize: [640, 480],
      mimes: ['video/mp4'],
      protocols: [1, 2, 3, 4, 5, 6, 7, 8],
      playbackmethod: [2],
      skip: 1
    }
  },
  bids: [
    // {
    //   bidder: 'appnexus',
    //   params: {
    //     placementId: 13232361
    //   }
    // },
    {
      bidder: 'rtbhouse',
      params: {
        publisherId: 'MMyM2ZNkRj5w5lniescG',  // Add your own placement id here.
        region: 'prebid-eu'
      }
    }
  ]
};

pbjs.que.push(function () {

  // configure prebid to use prebid cache and prebid server  
  // make sure to add your own accountId to your s2sConfig object 

  pbjs.setConfig({
    debug: true,
    consentManagement: {
      gdpr: {
        cmpApi: "static", // or 'static' for a non-standard IAB integrations
        timeout: 5000, // GDPR timeout 5000ms
        allowAuctionWithoutConsent: true,
        consentData: {
          getTCData: {
            gdprApplies: !true,
            eventStatus: "tcloaded",
            tcString:
              "CPa6mQAPa6mQAAGABCENCUCgAP_AAH_AAB5YIqNf_X__b3_j-_5___t0eY1f9_7__-0zjhfdt-8N2f_X_L8X_2M7vF36pq4KuR4Eu3LBIQdlHOHcTUmw6okVrzPsbk2cr7NKJ7PEinMbO2dYGH9_n93T_ZKY7_____77_v-_______f__-_f___59X---_f_V_995Ln9____39nO___9v-98__d____BFMAgwEBCAAEQQAQAgQAhAABACJACAQAEEIAFAEgA6qAAJXARGAhAAIBEBCAACAEBCDAIAAAIAkACAEALBAIAAIBAACCAUAAAAQkAgMAJAQAAAQAkIECIAIQICCIQATkMCAgAIIAUgkSAA4kMAIA6ywAIEGIFQgAlQCAYEAkLDzHpW5rcbZRlx__8EKwHBEBcAQwAyABlgDZAH4AQAAjABTwCrgGsAOqAfIBDoCRAE2AJ2AUiAuQBk4DOQGfAOUAdYJAGALZAfwA_-CAoIDQQJBAoCBwEEgIOgQnAhWBDqCIIIhCAB4A5ABzAIbASKAmoBTQC5QF0AMDAaEA28B2YD5QINAQkCQUgAEAALgAoACoAGQAOAAeABAADAAGUANAA1AB5AEMARQAmABPACqAG8AOYAegA_ACEAENAIgAiQBHACWAE0AKUAW4AwwBkQDKAMsAaoA2QB3gD2AHxAPsA_QCAAEUgIuAjABHACUgFBAKeAVcAuYBigDWAG0ANwAbwA4gB6AD5AIdARCAkQBMQCZQE2AJ2AUOApEBTQCxQFoALYAXIAu8BgwDDQGSAMnAZcAzkBnwDSAGnQNYA1mByYHKAOXAdYA8cKAUAEUAL4BCwC2QHbgP4Af-BAKCAoIDQQJBAoCBwEFwINAQdAhOBDSCG4IcQQ6BDuCIIIhARJCABwBSAMDAaEA3EB2YDugIoBoDwAXABDADIAGWANkAfgBAACCgEYAKeAVeAtAC0gGsAN4AdUA-QCHQEVAJEATYAnYBSIC5AGMAMnAZyAzwBnwDlAHWBwBgC2QH8AP6Af_BAUEBoIEggUBA4CDoEJwIVgQ6giCCIQYAgAOQAcwBogDZAIbAREAkUBNQC5QF0AMDAaEA28B2YDvwHwjICgAFAAhgBMAEcAMuAfYB-AEYAI4AVcArYBvAExAJsAWiAtgBeYDOQGeAM-AcoNAGALZAfwA_-CAoIDQQJBAoCBwEHQITgQ1AhwBDqCIIIhDABoABgBzADwAOqAiEBHoCRQFygLoAYAAwMBoQD4hUBgACgAQwAmABcAEcAMsAfgBGACOAFXgLQAtIBvAEggJiATYApsBbAC5AF5gM5AZ4Az4BuQDlBYA0BbID-AH_wQFBAaCBIIFAQOAgkBB0CE4ENQIcAQ6giCCIQoAeAAYAEIA5gB4AHVARCAj0BIoC5QF0AMAAYGA0IB1ADvx0GQABcAFAAVAAyABwAEAALoAYABlADQANQAeAA-gCGAIoATAAngBVAC4AGIAMwAbwA5gB6AD8AIaARABEgCOAEsAJgATQAowBSgCxAFvAMIAwwBkADKAGiANkAd4A9oB9gH6AP8AikBFgEYAI5ASkBKgCggFPAKuAWKAtAC0gFzALyAYoA2gBuADiAHUAPQAh0BEICKgEXgJBASIAlQBNgCdgFDgKaAVYAsUBaAC2AFwALkAXaAu8BgwDDQGJAMYAY8AyQBk4DKgGWAMuAZyAz4BokDSANJAaWA04BqoDWAHFwOTA5QBy4DrAHjgPSHgFwBFAC-AIyAhYBmwDtwH1AP4Af6A_8CAUEBQQGggSCBQEDgILgQdAhGBCcCFoENIIcAhzBEEEQgIkjgBIAZACfAGZAPkAmQBcQDQgG4gO6IQOgAFgAUAAyAC4AGIAQwAmABTACqAFwAMQAZgA3gB6AEcALEAYQA74B9gH4AP8AigBGACOAEpAKCAUMAp4BV4C0ALSAXMAxQBtADqAHoARCAkEBIgCVAE2AKaAWKAtEBbAC4AFyALtAYkAycBnIDPAGfANEAaSA0sBqoDgAHWAPHIgDgBfAEZAf_BAUEBoIEggUBA4CDoEIwITgQtghwCHMEQQRCAiSBFAgAJAAMAHcATIBPgDMgMAAaEA2oBuJKBqAAgABYAFAAMgAcAA_ADAAMQAeABEACYAFUALgAYgAzABtAENAIgAiQBHACjAFKALcAYQA1QBsgDvAH4ARgAjgBJwCngFXgLQAtIBigDcAHUAPkAh0BFQCLwEiAJsAWKAtgBdoDJwGWAM5AZ4Az4BpADWAHAAOsJgDgCMgPiAf0A_8CAoECQIHAQdAhGBCcCGkEOQQ6giCCIQEUCQAoAA4AZABqADmAJ8AZkA6oCIQEegJFKQRAAFwAUABUADIAHAAQQAwADKAGgAagA8gCGAIoATAAngBSACqAGIAMwAcwA_ACGgEQARIAowBSgCxAFuAMIAZQA0QBqgDZAHfAPsA_QCLAEYAI4ASkAoIBQwCrgFbALmAXkA2gBuAD0AIdAReAkQBNgCdgFDgLFAWwAuABcgC7QGGgMYAZIAycBlwDOQGeAM-gaQBpMDWANZgcmBygDlwHWAPHKgDgBfAPqAf_BAkECgIHAQdAhGBCcCFoENAIbQQ4BDmCIIIhARJKABwADgBkAGoAT4Bm0DcQNyAb4CAGADoAHWAWYBJ0C2QLaAXKAzwBt4DcQHRgO6AfKAA.f_gAAAAAAAAA"
          }
        }
      }
    },
    cache: {
      url: 'https://prebid.adnxs.com/pbc/v1/cache'
    },
    s2sConfig: {
      // timeout: 300,
      enabled: true,
      // endpoint: 'https://prebid.adnxs.com/pbs/v1/openrtb2/auction',
      // accountId: 'c9d412ee-3cc6-4b66-9326-9f49d528f13e', // replace this with your account id 
      // bidders: ['appnexus'],

      // endpoint: 'https://prebid-server.rtbhouse.net/openrtb2/auction',
      endpoint: 'http://localhost:8080/openrtb2/auction',
      syncEndpoint: 'http://localhost:8080/cookie_sync',
      accountId: '1001',
      bidders: ['rtbhouse'],

    }
  });

  // add your ad units to the bid request

  pbjs.addAdUnits(videoAdUnit);

  pbjs.requestBids({
    timeout: PREBID_TIMEOUT,
    bidsBackHandler: function (bids, timedOut, auctionId) {
      var videoUrl = pbjs.adServers.dfp.buildVideoUrl({
        adUnit: videoAdUnit,
        params: {
          // iu: '/19968336/prebid_cache_video_adunit',
          // cust_params: {
          //   section: 'blog',
          //   anotherKey: 'anotherValue'
          // },
          iu: '/31695560/video_01',
          cust_params: {
            adformat: 'video',
          },
          url: 'https://rtbhouse.com',
          // output: 'vast'
          output: 'xml_vast3'
        }
      });
      if (timedOut) {
        console.warn('Prebid request timed out!');
      } else {
        console.log('Prebid auctionId = ', auctionId, `got ${Object.keys(bids).length} bids`);
        invokeVideoPlayer(videoUrl);
      }
    }
  });
});