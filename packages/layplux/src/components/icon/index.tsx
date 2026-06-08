import { defineComponent } from 'vue';

interface IconProps {
  size?: number | string;
}

const iconProps = {
  size: { type: [Number, String], default: 16 },
};

function createIcon(d: string, viewBox = '0 0 16 16') {
  return defineComponent({
    name: 'LaypluxIcon',
    props: iconProps,
    setup(props: IconProps) {
      return () => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          width={props.size}
          height={props.size}
          fill="currentColor"
          style={{ flexShrink: 0 }}
        >
          <path d={d} />
        </svg>
      );
    },
  });
}

export const MoreIcon = createIcon(
  'M16 12a2 2 0 0 1 2-2a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2m-6 0a2 2 0 0 1 2-2a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2m-6 0a2 2 0 0 1 2-2a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2',
  '0 0 24 24',
);

export const MinimizeIcon = createIcon('M19 13H5v-2h14z', '0 0 24 24');

export const ChevronRightIcon = createIcon(
  'M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6z',
  '0 0 24 24',
);
