const viewConf = {
  editable: true,
  zoomFixed: false,
  trackSourceServers: ['http://higlass.io/api/v1'],
  views: [
    {
      uid: 'a',
      initialXDomain: [1480820463, 2550144059],
      initialYDomain: [1569819845, 2433776657],
      tracks: {
        top: [
          {
            type: 'horizontal-line',
            tilesetUid: 'e0DYtZBSTqiMLHoaimsSpg',
            server: 'http://higlass.io/api/v1',
            uid: 'h-line',
            height: 60,
            options: {
              showTooltip: true
            }
          }
        ],
        left: [
          {
            type: 'vertical-line',
            tilesetUid: 'e0DYtZBSTqiMLHoaimsSpg',
            server: 'http://higlass.io/api/v1',
            uid: 'v-line',
            width: 60,
            options: {
              showTooltip: true
            }
          }
        ],
        center: [
          {
            server: 'http://higlass.io/api/v1',
            tilesetUid: 'CQMd6V_cRw6iCI_-Unl3PQ',
            type: 'heatmap',
            position: 'center',
            uid: 'heatmap',
            options: {
              showTooltip: true
            }
          }
        ],
        bottom: [],
        right: []
      },
      layout: {
        w: 11,
        h: 14,
        x: 0,
        y: 0,
        i: 'a',
        moved: false,
        static: false
      }
    }
  ],
};

export default viewConf;
