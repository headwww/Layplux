export interface IPane {
  id: string;
  align: 'leftTop' | 'leftBottom' | 'bottomLeft' | 'rightTop' | 'rightBottom' | 'bottomRight';
  viewMode: 'DockPinned' | 'DockUnpinned' | 'Undock';
}
