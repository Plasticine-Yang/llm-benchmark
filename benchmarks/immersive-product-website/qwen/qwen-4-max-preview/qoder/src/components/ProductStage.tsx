import { memo } from 'react';
import { Headphone } from './Headphone';
import { IconBattery, IconDriver, IconSpatial } from './icons';

export const ProductStage = memo(function ProductStage() {
  return (
    <div className="stage" aria-hidden={false}>
      <div className="stage-halo" />
      <div className="stage-ring" />
      <div className="stage-dust" aria-hidden>
        <i /><i /><i /><i /><i />
      </div>

      <div className="stage-shadow" aria-hidden />

      <div className="stage-float">
        <Headphone idPrefix="hero" />
        <div className="stage-reflect" aria-hidden>
          <Headphone idPrefix="heroR" className="hp-reflect" />
        </div>
      </div>

      <div className="stage-sweep" aria-hidden />

      <div className="hud glass hud-42h">
        <IconBattery size={17} />
        <div>
          <div className="hud-value">42h</div>
          <div className="hud-label">续航</div>
        </div>
      </div>
      <div className="hud glass hud-spatial">
        <IconSpatial size={17} />
        <div>
          <div className="hud-value">Spatial Engine</div>
          <div className="hud-label">个性化 HRTF</div>
        </div>
      </div>
      <div className="hud glass hud-38mm">
        <IconDriver size={17} />
        <div>
          <div className="hud-value">38 mm</div>
          <div className="hud-label">镀铍振膜</div>
        </div>
      </div>
    </div>
  );
});