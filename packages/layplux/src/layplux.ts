import { useSkeleton, type Skeleton } from './managers';
import type { SkeletonConfig } from './types/widget-config';

export class Layplux {
  readonly skeleton: Skeleton;

  constructor() {
    this.skeleton = useSkeleton();
  }

  addWidget(config: SkeletonConfig, extraConfig?: Record<string, any>) {
    this.skeleton.add(config, extraConfig);
  }
}

const layplux = new Layplux();

layplux.addWidget({
  type: 'docked-pinned',
});
