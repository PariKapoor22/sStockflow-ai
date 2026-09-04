import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'zh';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', name: 'Mandarin', nativeName: '中文 (Mandarin)', flag: '🇨🇳' }
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Nav tabs
    'nav.dashboard': 'Dashboard',
    'nav.navigate': 'Navigate',
    'nav.report': 'Report',
    'nav.sos': 'SOS',
    'nav.sync': 'Sync',

    // Header & Global
    'header.dashboard': 'Driver Dashboard',
    'header.navigate': 'Tactical Map & Navigation',
    'header.report': 'Incident Reporting',
    'header.sos': 'Emergency Distress SOS',
    'header.sync': 'Offline Sync Center',
    'header.sector': 'SEC-4A',
    'header.mesh_link': 'Mesh Link Mode',
    'header.online_mode': '4G MESH',
    'header.spotty_mode': 'SPOTTY SAT',
    'header.offline_mode': 'OFFLINE',
    'header.change_language': 'Language',
    'header.select_language': 'Select Language',

    // Telemetry HUD
    'hud.speed': 'Speed',
    'hud.alt': 'Alt (ASL)',
    'hud.heading': 'Heading',
    'hud.accuracy': 'Accuracy',
    'hud.gps_fix': 'GPS FIX ACTIVE',
    'hud.tactical_grid': 'TACTICAL GRID',
    'hud.drop_pin': 'Drop Pin',
    'hud.cancel_pin': 'Cancel Pin',
    'hud.waypoints': 'Waypoints',
    'hud.reset_track': 'Reset Track',

    // Route Assessment
    'route.assessment': 'TACTICAL ROUTE ASSESSMENT',
    'route.clear': 'ROUTE CLEAR',
    'route.clear_desc': 'Route is 100% Clear & Verified Safe. Zero road blockages or hazards reported along corridor.',
    'route.hazards_detected': 'INCIDENT REPORTED ALONG CORRIDOR',
    'route.hazards_detected_desc': 'Hazards detected along path. Proceed with tactical caution.',
    'route.select': 'Select Tactical Route',
    'route.distance': 'Distance',
    'route.est_time': 'Est. Time',
    'route.elev_gain': 'Elev Gain',
    'route.switch_bypass': 'Switch to Valley Bypass (Clear)',
    'route.from_route': 'from route',
    'route.reported_by': 'Reported by',
    'route.offline_cached': 'Offline Cached',
    'route.hazard_detected': 'HAZARD DETECTED',
    'route.recommended_bypass': 'Recommended bypass available:',

    // Incident Reporting
    'report.title': 'Tactical Incident Report',
    'report.subtitle': 'Log field hazard, road blockage or safety event',
    'report.log_tab': 'New Field Incident',
    'report.history_tab': 'Incident Logs',
    'report.geo_telemetry': 'Incident Geolocation Telemetry',
    'report.live_tracking': 'LIVE TRACKING',
    'report.track_current': 'Track Current Location',
    'report.tracking_active': 'Tracking Current Location (Active)',
    'report.sync_fix': 'Sync Fix',
    'report.category': 'Incident Category',
    'report.severity': 'Severity Level',
    'report.title_field': 'Incident Title / Summary *',
    'report.title_placeholder': 'e.g., Heavy Rockfall on Ridge Mile 42',
    'report.landmark_field': 'Location Landmark / Kilometer Marker',
    'report.landmark_placeholder': 'e.g., Sela Ridge Kilometer Marker 42',
    'report.description': 'Tactical Description & Action Required',
    'report.desc_placeholder': 'Provide detailed description of obstruction, bypass conditions, required equipment, or casualties...',
    'report.photo_evidence': 'Attached Field Photos',
    'report.capture_photo': 'Capture / Upload Photo',
    'report.sample_photo': 'Sample Photo',
    'report.submit_online': 'Broadcast Report Immediately',
    'report.submit_offline': 'Save to Offline Sync Queue',
    'report.saving': 'Saving Report...',
    'report.no_incidents': 'No incidents recorded',
    'report.all_clear': 'All tactical sectors reported clear.',
    'report.view_on_map': 'View on Map',
    'report.delete': 'Delete',

    // Incident Categories & Severities
    'report.cat_landslide': 'Landslide / Rockfall',
    'report.cat_roadblock': 'Road Obstruction',
    'report.cat_bridge': 'Bridge / Road Damage',
    'report.cat_breakdown': 'Vehicle Breakdown',
    'report.cat_weather': 'Weather / Blizzard',
    'report.cat_medical': 'Medical Evac Need',
    'report.sev_low': 'Low',
    'report.sev_medium': 'Medium',
    'report.sev_high': 'High',
    'report.sev_critical': 'Critical',

    // SOS Emergency
    'sos.beacon_active': '🚨 SATELLITE DISTRESS BEACON ACTIVE',
    'sos.broadcasting': 'Broadcasting SOS Coordinates',
    'sos.broadcasting_desc': 'Emergency transponder is transmitting priority location telemetry over military satellite constellation.',
    'sos.title': 'Emergency Distress Transponder',
    'sos.desc': 'Use only in critical situations requiring immediate tactical extraction, severe trauma, or armed threat.',
    'sos.hold_trigger': 'Hold Button For 2 Seconds to Trigger',
    'sos.hold_button': 'HOLD SOS',
    'sos.cancel_beacon': 'Cancel Distress Beacon (False Alarm)',
    'sos.conditions': 'Select Distress Condition(s)',
    'sos.medical_needed': 'Medical Evac Required',
    'sos.medical_sub': 'Severe injury or trauma in convoy',
    'sos.vehicle_disabled': 'Vehicle Immobile / Stranded',
    'sos.vehicle_sub': 'Mechanical breakdown, rolled over or blocked',
    'sos.threat_present': 'Hostile Contact / Security Hazard',
    'sos.threat_sub': 'Armed threat or ambush situation',
    'sos.radio_guard': 'Emergency Radio Guard Channels',
    'sos.beacon_id': 'BEACON ID:',
    'sos.vehicle_unit': 'VEHICLE / UNIT:',
    'sos.exact_coords': 'EXACT COORDINATES:',
    'sos.elevation': 'ELEVATION / ALTITUDE:',
    'sos.sat_pulse': 'SAT BURST TRANSMISSIONS:',

    // Driver Home
    'home.mission_order': 'Active Mission Order',
    'home.mission_title': 'Supply Convoy: Sector 4 Alpha',
    'home.mission_desc': 'Deliver critical cold-weather medical kits & tactical radio transceivers to outpost commander.',
    'home.next_checkpoint': 'Next Checkpoint',
    'home.remaining_dist': 'Remaining Dist',
    'home.hazards_en_route': 'Hazards En Route',
    'home.realtime_loc': 'Real-Time Location & Sector',
    'home.full_map': 'Full Map View',
    'home.navigate_route': 'Navigate Route',
    'home.log_incident': 'Log Incident',
    'home.sync_queue': 'Sync Queue',
    'home.distress_sos': 'Distress SOS',
    'home.telemetry_title': 'Convoy Unit Telemetry (ECHO-07)',
    'home.battery': 'Aux Battery',
    'home.fuel': 'Diesel Tank',
    'home.tire': 'Tire Pressure',
    'home.radio': 'Radio Link',
    'home.activity_log': 'Live Activity Log',

    // Offline Sync
    'sync.title': 'Offline Synchronization Center',
    'sync.network_status': 'Network Status',
    'sync.online_uplink': 'Online Uplink',
    'sync.offline_mode': 'Offline Mode',
    'sync.online_desc': 'Connected via tactical satellite mesh. High-speed synchronized link established.',
    'sync.offline_desc': 'Operating on local cache. Data will sync automatically when connection is restored.',
    'sync.last_synced': 'Last synced',
    'sync.waiting_queue': 'items waiting in local queue',
    'sync.force_sync': 'Force Sync',
    'sync.syncing': 'Syncing...',
    'sync.pending_uploads': 'Pending Uploads',
    'sync.add_test_item': 'Add Test Queue Item',
    'sync.queue_clear': 'Queue is clear',
    'sync.queue_clear_desc': 'All field reports & telemetry are synced to tactical HQ.',
    'sync.map_tiles': 'Offline Map Tiles',
    'sync.cached': 'Cached',
    'sync.open_map': 'Open Map',
    'sync.purge_cache': 'Purge Cache',
    'sync.download_pack': 'Download Pack',
    'sync.streaming_tiles': 'Streaming tiles...',
    'sync.downloaded': 'Downloaded',
    'sync.downloading': 'Downloading...',
    'sync.update_available': 'Update Available',
    'sync.available_offline': 'Available Offline',
    'sync.retry': 'Retry',
    'sync.cancel': 'Cancel'
  },

  hi: {
    // Nav tabs
    'nav.dashboard': 'डैशबोर्ड',
    'nav.navigate': 'नेविगेट',
    'nav.report': 'रिपोर्ट',
    'nav.sos': 'एसओएस',
    'nav.sync': 'सिंक',

    // Header & Global
    'header.dashboard': 'चालक डैशबोर्ड',
    'header.navigate': 'रणनीतिक नक्शा और नेविगेशन',
    'header.report': 'घटना रिपोर्टिंग',
    'header.sos': 'आपातकालीन एसओएस',
    'header.sync': 'ऑफ़लाइन सिंक केंद्र',
    'header.sector': 'सेक्टर-4A',
    'header.mesh_link': 'मेश लिंक मोड',
    'header.online_mode': '4G मेश',
    'header.spotty_mode': 'कमजोर उपग्रह',
    'header.offline_mode': 'ऑफ़लाइन',
    'header.change_language': 'भाषा',
    'header.select_language': 'भाषा चुनें',

    // Telemetry HUD
    'hud.speed': 'गति',
    'hud.alt': 'ऊंचाई (समुद्र स्तर)',
    'hud.heading': 'दिशा',
    'hud.accuracy': 'सटीकता',
    'hud.gps_fix': 'जीपीएस सक्रिय',
    'hud.tactical_grid': 'रणनीतिक ग्रिड',
    'hud.drop_pin': 'पिन लगाएं',
    'hud.cancel_pin': 'पिन रद्द करें',
    'hud.waypoints': 'वेपॉइंट्स',
    'hud.reset_track': 'ट्रैक रीसेट',

    // Route Assessment
    'route.assessment': 'मार्ग सुरक्षा मूल्यांकन',
    'route.clear': 'मार्ग साफ है',
    'route.clear_desc': 'मार्ग 100% सुरक्षित और साफ़ है। कोई रुकावट या खतरा दर्ज नहीं है।',
    'route.hazards_detected': 'मार्ग पर घटना दर्ज',
    'route.hazards_detected_desc': 'मार्ग में खतरे का पता चला है। सावधानी से आगे बढ़ें।',
    'route.select': 'रणनीतिक मार्ग चुनें',
    'route.distance': 'दूरी',
    'route.est_time': 'अनुमानित समय',
    'route.elev_gain': 'ऊंचाई वृद्धि',
    'route.switch_bypass': 'सुरक्षित बायपास मार्ग चुनें (साफ़)',
    'route.from_route': 'मार्ग से दूरी',
    'route.reported_by': 'रिपोर्टकर्ता',
    'route.offline_cached': 'ऑफ़लाइन संचित',
    'route.hazard_detected': 'खतरा पहचाना गया',
    'route.recommended_bypass': 'अनुशंसित बायपास उपलब्ध:',

    // Incident Reporting
    'report.title': 'घटना रिपोर्टिंग',
    'report.subtitle': 'फ़ील्ड खतरा, सड़क अवरोध या सुरक्षा घटना दर्ज करें',
    'report.log_tab': 'नई घटना दर्ज करें',
    'report.history_tab': 'घटना लॉग इतिहास',
    'report.geo_telemetry': 'स्थान टेलीमेट्री',
    'report.live_tracking': 'लाइव ट्रैकिंग',
    'report.track_current': 'वर्तमान स्थान ट्रैक करें',
    'report.tracking_active': 'वर्तमान स्थान ट्रैक हो रहा है (सक्रिय)',
    'report.sync_fix': 'स्थान सिंक करें',
    'report.category': 'घटना श्रेणी',
    'report.severity': 'गंभीरता स्तर',
    'report.title_field': 'घटना शीर्षक / सारांश *',
    'report.title_placeholder': 'उदा. माइल 42 पर भारी भूस्खलन',
    'report.landmark_field': 'स्थान / किलोमीटर मील का पत्थर',
    'report.landmark_placeholder': 'उदा. सेला रिज मील का पत्थर 42',
    'report.description': 'विवरण और आवश्यक कार्रवाई',
    'report.desc_placeholder': 'अवरोध, खतरे या वाहन की स्थिति का विवरण लिखें...',
    'report.photo_evidence': 'संलग्न फ़ोटो',
    'report.capture_photo': 'फ़ोटो लें / अपलोड करें',
    'report.sample_photo': 'नमूना फ़ोटो',
    'report.submit_online': 'तुरंत प्रसारित करें',
    'report.submit_offline': 'ऑफ़लाइन सिंक कतार में सहेजें',
    'report.saving': 'सहेजा जा रहा है...',
    'report.no_incidents': 'कोई घटना दर्ज नहीं',
    'report.all_clear': 'सभी रणनीतिक क्षेत्र साफ़ हैं।',
    'report.view_on_map': 'नक्शे पर देखें',
    'report.delete': 'हटाएं',

    // Incident Categories & Severities
    'report.cat_landslide': 'भूस्खलन / चट्टान गिरना',
    'report.cat_roadblock': 'सड़क अवरोध',
    'report.cat_bridge': 'पुल / सड़क क्षति',
    'report.cat_breakdown': 'वाहन खराबी',
    'report.cat_weather': 'मौसम / बर्फीला तूफान',
    'report.cat_medical': 'चिकित्सा सहायता आवश्यक',
    'report.sev_low': 'निम्न',
    'report.sev_medium': 'मध्यम',
    'report.sev_high': 'उच्च',
    'report.sev_critical': 'गंभीर',

    // SOS Emergency
    'sos.beacon_active': '🚨 उपग्रह संकट बीकन सक्रिय',
    'sos.broadcasting': 'एसओएस निर्देशांक प्रसारित हो रहे हैं',
    'sos.broadcasting_desc': 'आपातकालीन बीकन सैन्य उपग्रह के माध्यम से स्थान प्रसारित कर रहा है।',
    'sos.title': 'आपातकालीन संकट ट्रांसपोंडर',
    'sos.desc': 'केवल गंभीर परिस्थितियों या सुरक्षा खतरे में ही उपयोग करें।',
    'sos.hold_trigger': 'सक्रिय करने के लिए 2 सेकंड दबाए रखें',
    'sos.hold_button': 'एसओएस दबाएं',
    'sos.cancel_beacon': 'बीकन रद्द करें (गलत अलार्म)',
    'sos.conditions': 'संकट की स्थिति चुनें',
    'sos.medical_needed': 'चिकित्सा आपातकाल',
    'sos.medical_sub': 'काफ़िले में गंभीर चोट या आघात',
    'sos.vehicle_disabled': 'वाहन गतिहीन / फंसा हुआ',
    'sos.vehicle_sub': 'यांत्रिक खराबी या अवरोध',
    'sos.threat_present': 'शत्रु संपर्क / सुरक्षा खतरा',
    'sos.threat_sub': 'सशस्त्र खतरा या घात',
    'sos.radio_guard': 'आपातकालीन रेडियो गार्ड चैनल',
    'sos.beacon_id': 'बीकन आईडी:',
    'sos.vehicle_unit': 'वाहन / यूनिट:',
    'sos.exact_coords': 'सटीक निर्देशांक:',
    'sos.elevation': 'ऊंचाई (समुद्र तल):',
    'sos.sat_pulse': 'उपग्रह पल्स प्रसारण:',

    // Driver Home
    'home.mission_order': 'सक्रिय मिशन आदेश',
    'home.mission_title': 'सप्लाई काफिला: सेक्टर 4 अल्फा',
    'home.mission_desc': 'चौकी कमांडर को महत्वपूर्ण चिकित्सा किट और रणनीतिक रेडियो ट्रांससीवर्स पहुंचाएं।',
    'home.next_checkpoint': 'अगला चेकपॉइंट',
    'home.remaining_dist': 'शेष दूरी',
    'home.hazards_en_route': 'मार्ग में खतरे',
    'home.realtime_loc': 'वास्तविक समय स्थान और सेक्टर',
    'home.full_map': 'पूर्ण नक्शा दृश्य',
    'home.navigate_route': 'मार्ग नेविगेट करें',
    'home.log_incident': 'घटना दर्ज करें',
    'home.sync_queue': 'सिंक कतार',
    'home.distress_sos': 'संकट एसओएस',
    'home.telemetry_title': 'काफिला इकाई टेलीमेट्री (ECHO-07)',
    'home.battery': 'सहायक बैटरी',
    'home.fuel': 'डीजल टैंक',
    'home.tire': 'टायर दबाव',
    'home.radio': 'रेडियो लिंक',
    'home.activity_log': 'लाइव गतिविधि लॉग',

    // Offline Sync
    'sync.title': 'ऑफ़लाइन सिंक्रोनाइज़ेशन केंद्र',
    'sync.network_status': 'नेटवर्क स्थिति',
    'sync.online_uplink': 'ऑनलाइन अपलिंक',
    'sync.offline_mode': 'ऑफ़लाइन मोड',
    'sync.online_desc': 'रणनीतिक उपग्रह जाल से जुड़ा है। हाई-स्पीड लिंक स्थापित।',
    'sync.offline_desc': 'स्थानीय कैश पर काम कर रहा है। कनेक्शन बहाल होने पर डेटा स्वचालित रूप से सिंक होगा।',
    'sync.last_synced': 'अंतिम सिंक',
    'sync.waiting_queue': 'आइटम स्थानीय कतार में प्रतीक्षारत हैं',
    'sync.force_sync': 'बलपूर्वक सिंक करें',
    'sync.syncing': 'सिंक हो रहा है...',
    'sync.pending_uploads': 'लंबित अपलोड',
    'sync.add_test_item': 'परीक्षण कतार आइटम जोड़ें',
    'sync.queue_clear': 'कतार साफ़ है',
    'sync.queue_clear_desc': 'सभी फ़ील्ड रिपोर्ट और टेलीमेट्री मुख्यालय में सिंक हो गई हैं।',
    'sync.map_tiles': 'ऑफ़लाइन मानचित्र टाइलें',
    'sync.cached': 'संचित',
    'sync.open_map': 'मानचित्र खोलें',
    'sync.purge_cache': 'कैश साफ़ करें',
    'sync.download_pack': 'पैक डाउनलोड करें',
    'sync.streaming_tiles': 'टाइलें लोड हो रही हैं...',
    'sync.downloaded': 'डाउनलोड हो गया',
    'sync.downloading': 'डाउनलोड हो रहा है...',
    'sync.update_available': 'अपडेट उपलब्ध',
    'sync.available_offline': 'ऑफ़लाइन उपलब्ध',
    'sync.retry': 'पुनः प्रयास',
    'sync.cancel': 'रद्द करें'
  },

  zh: {
    // Nav tabs
    'nav.dashboard': '仪表板',
    'nav.navigate': '导航',
    'nav.report': '报告',
    'nav.sos': '求救',
    'nav.sync': '同步',

    // Header & Global
    'header.dashboard': '驾驶员仪表板',
    'header.navigate': '战术地图与导航',
    'header.report': '事件报告中心',
    'header.sos': '紧急求救 (SOS)',
    'header.sync': '离线同步中心',
    'header.sector': '4A 扇区',
    'header.mesh_link': '网状链路模式',
    'header.online_mode': '4G 网格',
    'header.spotty_mode': '不稳定卫星',
    'header.offline_mode': '离线状态',
    'header.change_language': '语言',
    'header.select_language': '选择语言',

    // Telemetry HUD
    'hud.speed': '速度',
    'hud.alt': '海拔 (ASL)',
    'hud.heading': '航向',
    'hud.accuracy': '精度',
    'hud.gps_fix': 'GPS 定位有效',
    'hud.tactical_grid': '战术网格',
    'hud.drop_pin': '放置图钉',
    'hud.cancel_pin': '取消图钉',
    'hud.waypoints': '航点',
    'hud.reset_track': '重置轨迹',

    // Route Assessment
    'route.assessment': '战术路线安全评估',
    'route.clear': '路线畅通',
    'route.clear_desc': '路线 100% 畅通且经核实安全。沿途未报告道路阻塞或危险。',
    'route.hazards_detected': '沿途已报告险情',
    'route.hazards_detected_desc': '沿线发现险情。请保持高度战术警惕行进。',
    'route.select': '选择战术路线',
    'route.distance': '距离',
    'route.est_time': '预计时间',
    'route.elev_gain': '海拔爬升',
    'route.switch_bypass': '切换至山谷绕行路线 (畅通)',
    'route.from_route': '偏离路线',
    'route.reported_by': '报告人',
    'route.offline_cached': '已离线缓存',
    'route.hazard_detected': '发现险情',
    'route.recommended_bypass': '推荐可用绕行方案：',

    // Incident Reporting
    'report.title': '战术事件报告',
    'report.subtitle': '记录现场危险、道路封锁或安全事件',
    'report.log_tab': '新建现场报告',
    'report.history_tab': '事件日志历史',
    'report.geo_telemetry': '事件地理位置遥测',
    'report.live_tracking': '实时追踪',
    'report.track_current': '追踪当前位置',
    'report.tracking_active': '正在追踪当前位置 (已激活)',
    'report.sync_fix': '同步定位',
    'report.category': '事件类别',
    'report.severity': '严重等级',
    'report.title_field': '事件标题 / 概述 *',
    'report.title_placeholder': '例如：第42英里山脊严重落石',
    'report.landmark_field': '位置地标 / 公里桩',
    'report.landmark_placeholder': '例如：塞拉山脊42公里标牌',
    'report.description': '战术描述与所需行动',
    'report.desc_placeholder': '提供障碍物详情、绕行条件、所需装备或伤亡情况...',
    'report.photo_evidence': '现场照片证据',
    'report.capture_photo': '拍摄 / 上传照片',
    'report.sample_photo': '样例照片',
    'report.submit_online': '立即广播报告',
    'report.submit_offline': '保存至离线同步队列',
    'report.saving': '正在保存报告...',
    'report.no_incidents': '暂无事件记录',
    'report.all_clear': '所有战术扇区均报告畅通。',
    'report.view_on_map': '在地图上查看',
    'report.delete': '删除',

    // Incident Categories & Severities
    'report.cat_landslide': '滑坡 / 落石',
    'report.cat_roadblock': '道路受阻',
    'report.cat_bridge': '桥梁 / 道路损毁',
    'report.cat_breakdown': '车辆故障',
    'report.cat_weather': '恶劣天气 / 暴风雪',
    'report.cat_medical': '需要紧急医疗后送',
    'report.sev_low': '低',
    'report.sev_medium': '中',
    'report.sev_high': '高',
    'report.sev_critical': '极危',

    // SOS Emergency
    'sos.beacon_active': '🚨 卫星求救信标已激活',
    'sos.broadcasting': '正在广播 SOS 紧急坐标',
    'sos.broadcasting_desc': '应急应答机正通过军用卫星星座传输最高优先级定位遥测。',
    'sos.title': '应急遇险应答机',
    'sos.desc': '仅在需要紧急战术撤离、严重创伤或遭遇武装威胁的关键情况下使用。',
    'sos.hold_trigger': '按住按钮 2 秒以触发',
    'sos.hold_button': '长按求救',
    'sos.cancel_beacon': '取消遇险信标 (误报)',
    'sos.conditions': '选择遇险状况',
    'sos.medical_needed': '需要医疗后送',
    'sos.medical_sub': '车队有人员受重伤或创伤',
    'sos.vehicle_disabled': '车辆抛锚 / 被困',
    'sos.vehicle_sub': '机械故障、侧翻或受阻',
    'sos.threat_present': '敌对接触 / 安全险情',
    'sos.threat_sub': '武装威胁或遭遇伏击',
    'sos.radio_guard': '紧急无线电值守频道',
    'sos.beacon_id': '信标编号：',
    'sos.vehicle_unit': '车辆 / 单位：',
    'sos.exact_coords': '精准坐标：',
    'sos.elevation': '海拔高度：',
    'sos.sat_pulse': '卫星突发传输：',

    // Driver Home
    'home.mission_order': '当前任务指令',
    'home.mission_title': '补给车队：4A 扇区',
    'home.mission_desc': '向前哨指挥官运送关键防寒医疗包和战术无线电收发机。',
    'home.next_checkpoint': '下一检查站',
    'home.remaining_dist': '剩余距离',
    'home.hazards_en_route': '沿途险情',
    'home.realtime_loc': '实时位置与扇区',
    'home.full_map': '全地图视图',
    'home.navigate_route': '导航路线',
    'home.log_incident': '记录事件',
    'home.sync_queue': '同步队列',
    'home.distress_sos': '遇险求救',
    'home.telemetry_title': '车队单位遥测 (ECHO-07)',
    'home.battery': '辅助电池',
    'home.fuel': '柴油油量',
    'home.tire': '轮胎气压',
    'home.radio': '无线电链路',
    'home.activity_log': '实时活动日志',

    // Offline Sync
    'sync.title': '离线同步中心',
    'sync.network_status': '网络状态',
    'sync.online_uplink': '在线上行链路',
    'sync.offline_mode': '离线模式',
    'sync.online_desc': '通过战术卫星网格连接。高速同步链路已建立。',
    'sync.offline_desc': '运行于本地缓存。网络恢复后数据将自动同步。',
    'sync.last_synced': '上次同步',
    'sync.waiting_queue': '个项目在本地队列中等待',
    'sync.force_sync': '强制同步',
    'sync.syncing': '正在同步...',
    'sync.pending_uploads': '待上传项',
    'sync.add_test_item': '添加测试队列项',
    'sync.queue_clear': '队列已清空',
    'sync.queue_clear_desc': '所有现场报告与遥测数据已同步至战术总部。',
    'sync.map_tiles': '离线地图瓦片',
    'sync.cached': '已缓存',
    'sync.open_map': '打开地图',
    'sync.purge_cache': '清理缓存',
    'sync.download_pack': '下载数据包',
    'sync.streaming_tiles': '正在流式传输瓦片...',
    'sync.downloaded': '已下载',
    'sync.downloading': '正在下载...',
    'sync.update_available': '有可用更新',
    'sync.available_offline': '离线可用',
    'sync.retry': '重试',
    'sync.cancel': '取消'
  }
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('tactical_app_lang');
    if (saved === 'hi' || saved === 'zh' || saved === 'en') {
      return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('tactical_app_lang', lang);
  };

  const t = (key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
