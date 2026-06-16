"use client";

import { useEffect } from "react";
import * as ChannelService from "@channel.io/channel-web-sdk-loader";

/**
 * 채널톡(Channel Talk) 상담 위젯.
 * - pluginKey 는 클라이언트에 노출되는 공개값이라 그대로 둔다(비밀키 아님).
 * - 익명 boot: 로그인/회원 시스템이 없으므로 memberId·memberHash 없이 부팅한다.
 */
const PLUGIN_KEY = "ba4385dd-471a-474e-bbf0-2971c4e24346";

export function ChannelTalk() {
  useEffect(() => {
    ChannelService.loadScript();
    ChannelService.boot({ pluginKey: PLUGIN_KEY });

    return () => {
      ChannelService.shutdown();
    };
  }, []);

  return null;
}
