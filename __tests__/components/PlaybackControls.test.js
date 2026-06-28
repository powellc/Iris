import React from 'react';
import { act } from 'react-test-renderer';
import { render } from '../test-wrapper';
import PlaybackControls from '../../src/js/components/PlaybackControls';
import state from '../state';

const mockState = {
  ...state,
  mopidy: {
    ...state.mopidy,
    time_position: 0,
    volume: 50,
    mute: false,
    play_state: 'stopped',
    consume: false,
    random: false,
    repeat: false,
    host: 'localhost',
    port: '6680',
    ssl: false,
  },
  ui: {
    ...state.ui,
    touch_enabled: false,
    sidebar_open: false,
    slim_mode: false,
  },
  core: {
    ...state.core,
    streamTitle: null,
    current_track: null,
    next_track_uri: null,
  },
};

jest.mock('react-redux', () => ({
  useSelector: jest.fn().mockImplementation((func) => func(mockState)),
  useDispatch: () => jest.fn(),
}));

jest.mock('../../src/js/components/Icon', () => 'Icon');
jest.mock('../../src/js/components/Link', () => 'Link');
jest.mock('../../src/js/components/Thumbnail', () => 'Thumbnail');
jest.mock('../../src/js/components/LinksSentence', () => 'LinksSentence');
jest.mock('../../src/js/components/Fields/ProgressSlider', () => 'ProgressSlider');
jest.mock('../../src/js/components/Fields/VolumeControl', () => 'VolumeControl');
jest.mock('../../src/js/components/Fields/MuteControl', () => 'MuteControl');
jest.mock('../../src/js/components/Fields/OutputControl', () => 'OutputControl');

function findSmartQueueButton(renderer) {
  const buttons = renderer.root.findAllByType('button');
  return buttons.find((btn) => {
    if (!btn.props.children) return false;
    const children = Array.isArray(btn.props.children)
      ? btn.props.children
      : [btn.props.children];
    return children.some(
      (child) => child.props && child.props.name === 'lightbulb_outline',
    );
  });
}

describe('<PlaybackControls />', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
  });

  it('should render correctly', () => {
    const result = render(<PlaybackControls />).toJSON();
    expect(result).toMatchSnapshot();
  });

  it('should render smart queue button in settings section', () => {
    const renderer = render(<PlaybackControls />);
    expect(findSmartQueueButton(renderer)).toBeTruthy();
  });

  it('should have inactive smart queue button by default', () => {
    const renderer = render(<PlaybackControls />);
    const btn = findSmartQueueButton(renderer);
    expect(btn.props.className).not.toContain('control--active');
  });

  it('should toggle active class on click and call fetch', () => {
    const renderer = render(<PlaybackControls />);
    const btn = findSmartQueueButton(renderer);
    act(() => { btn.props.onClick(); });

    const newBtn = findSmartQueueButton(renderer);
    expect(newBtn.props.className).toContain('control--active');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:6680/smartplaylists/smart-queue',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      },
    );
  });

  it('should send enabled=false on second click', () => {
    const renderer = render(<PlaybackControls />);
    let btn = findSmartQueueButton(renderer);
    act(() => { btn.props.onClick(); });

    btn = findSmartQueueButton(renderer);
    act(() => { btn.props.onClick(); });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenLastCalledWith(
      'http://localhost:6680/smartplaylists/smart-queue',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      },
    );
  });

  it('should restore smart queue state from localStorage', () => {
    localStorage.setItem('smartQueue', 'true');
    const renderer = render(<PlaybackControls />);
    const btn = findSmartQueueButton(renderer);
    expect(btn.props.className).toContain('control--active');
  });


});
