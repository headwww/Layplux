import { defineComponent } from 'vue';
import { PanelView } from '../../components';

export const CenterArea = defineComponent({
  name: 'CenterArea',
  setup() {
    return () => (
      <div class="layplux-center-area">
        <div>
          <div>
            <PanelView></PanelView>
            <PanelView></PanelView>
          </div>
          <div></div>
          <div>
            <PanelView></PanelView>
            <PanelView></PanelView>
          </div>
        </div>
        <div>
          <PanelView></PanelView>
          <PanelView></PanelView>
        </div>
      </div>
    );
  },
});
