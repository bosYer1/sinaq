'use client';

import Script from 'next/script';

const POSTHOG_PROJECT_TOKEN = 'phc_rxBVsU3nYRqYaMAUCoGd5nE7YgcAJKcdCaaSRawE964p';
const POSTHOG_HOST = 'https://us.i.posthog.com';
const BLOCKED_TEST_DISTINCT_ID = '01a053ae-c894-77db-80bc-889fba23279a';

const postHogInitScript = `!function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}p||((p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/1/array.js",p.onerror=function(){p=null},(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r));var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init('${POSTHOG_PROJECT_TOKEN}',{api_host:'${POSTHOG_HOST}',defaults:'2026-05-30',disable_session_recording:true,before_send:function(event){try{var props=event&&event.properties?event.properties:{};var path=props.$pathname||window.location.pathname||'';var distinct=event&&event.distinct_id?event.distinct_id:(props.distinct_id||'');if(path.indexOf('/admin')===0||path.indexOf('/api')===0||distinct==='${BLOCKED_TEST_DISTINCT_ID}')return null;var params=new URLSearchParams(window.location.search||'');if(params.get('__analytics_smoke')==='1')props.gameyer_analytics_test=true;props.gameyer_traffic_scope='public';event.properties=props;}catch(e){}return event;}});`;

export function PostHogAnalytics() {
  return (
    <Script id="posthog-analytics" strategy="afterInteractive">
      {postHogInitScript}
    </Script>
  );
}
