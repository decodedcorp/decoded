export interface BoxPercent {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type CalloutSide = "left" | "right" | "top" | "bottom";

export type CalloutOffsetUnit = "px" | "%";

export interface CalloutLayout {
  side: CalloutSide;
  align: number; // 0~100
  offset: number;
  offsetUnit?: CalloutOffsetUnit; // default: "px"
}

export interface ScanItem {
  id: string;
  name: string;
  confidence: number;
  box: BoxPercent;
  callout?: CalloutLayout;
}

export interface ScanData {
  photoUrl: string;
  items: ScanItem[];
}

export interface AnchorPoint {
  x: number;
  y: number;
}

export interface ConnectorAnchor {
  itemId: string;
  boxAnchor: AnchorPoint;
  cardAnchor: AnchorPoint;
}
