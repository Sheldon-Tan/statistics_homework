(() => {
  'use strict';

  const endpoint = '/.netlify/functions/visitor-stats';
  const names = {
    ada:'阿达·洛夫莱斯', euler:'莱昂哈德·欧拉', ramanujan:'斯里尼瓦瑟·拉马努金',
    noether:'埃米·诺特', gauss:'卡尔·高斯', turing:'艾伦·图灵',
    leibniz:'戈特弗里德·莱布尼茨', germain:'索菲·热尔曼', hypatia:'希帕蒂娅',
    vonneumann:'约翰·冯·诺依曼', newton:'艾萨克·牛顿', descartes:'勒内·笛卡尔',
    fermat:'皮埃尔·费马', riemann:'伯恩哈德·黎曼', cantor:'格奥尔格·康托尔',
    poincare:'亨利·庞加莱', hilbert:'大卫·希尔伯特', johnson:'凯瑟琳·约翰逊',
    mirzakhani:'玛丽亚姆·米尔扎哈尼', boole:'乔治·布尔'
  };
  const $ = id => document.getElementById(id);
  const visitId = crypto.randomUUID();
  const number = value => Number(value || 0).toLocaleString('zh-CN');

  function row(label, count, max, className = '') {
    const item = document.createElement('div');
    item.className = `crowd-row ${className}`;
    const name = document.createElement('span');
    name.textContent = label;
    name.title = label;
    const track = document.createElement('div');
    track.className = 'crowd-track';
    const bar = document.createElement('i');
    bar.style.width = `${max ? Math.max(2, 100 * count / max) : 0}%`;
    track.append(bar);
    const value = document.createElement('b');
    value.textContent = number(count);
    item.append(name, track, value);
    return item;
  }

  function render(data) {
    $('crowd-visits').textContent = number(data.visits);
    $('crowd-players').textContent = number(data.players);
    $('crowd-draws').textContent = number(data.draws);
    $('crowd-duplicate-rate').textContent = data.draws
      ? `${(100 * data.duplicates / data.draws).toFixed(1)}%` : '0%';

    const tiers = [['common','普通'], ['rare','稀有'], ['legendary','传奇']];
    const tierBox = $('crowd-tiers');
    const maxTier = Math.max(0, ...tiers.map(([id]) => data.tiers[id] || 0));
    tierBox.replaceChildren(...tiers.map(([id, label]) => row(label, data.tiers[id] || 0, maxTier, id)));
    tierBox.classList.remove('crowd-empty');

    const cardBox = $('crowd-cards');
    const leaders = Object.entries(data.cards)
      .filter(([id]) => Object.hasOwn(names, id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    if (!leaders.length) {
      cardBox.textContent = '还没有真实开包记录。';
      cardBox.classList.add('crowd-empty');
    } else {
      cardBox.replaceChildren(...leaders.map(([id, count]) => row(names[id], count, leaders[0][1])));
      cardBox.classList.remove('crowd-empty');
    }
    $('crowd-status').textContent = '全站数据已更新';
  }

  async function refresh() {
    $('crowd-status').textContent = '正在读取全站统计…';
    try {
      const response = await fetch(endpoint, {cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      render(await response.json());
    } catch {
      $('crowd-status').textContent = location.protocol === 'file:'
        ? '请通过 Netlify 网址查看全站统计。'
        : '暂时无法读取统计，请稍后刷新。';
    }
  }

  async function record(payload) {
    try {
      const response = await fetch(endpoint, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await refresh();
    } catch {
      $('crowd-status').textContent = location.protocol === 'file:'
        ? '请通过 Netlify 网址查看全站统计。'
        : '本次记录未能同步，统计可能暂时不完整。';
    }
  }

  $('crowd-refresh').addEventListener('click', refresh);
  window.addEventListener('real-card-draw', event => {
    const cards = event.detail?.cards;
    if (Array.isArray(cards) && cards.length) {
      record({type:'draw', visitId, eventId:crypto.randomUUID(), cards});
    }
  });
  record({type:'visit', visitId});
})();
