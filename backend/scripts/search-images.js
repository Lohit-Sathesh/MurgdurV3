const https = require('https');
const fs = require('fs');

const queries = {
  mensShirts: 'mens dress shirt',
  mensTshirts: 'mens polo shirt',
  mensDenims: 'mens denim jeans',
  mensSuits: 'mens suit jacket',
  mensTrousers: 'mens chino trousers',
  menShoes: 'mens leather shoes',
  mensBags: 'leather briefcase bag',
  womensDresses: 'womens evening dress',
  womensTops: 'womens silk blouse',
  womensSkirts: 'womens skirt fashion',
  womensTshirts: 'womens sweatshirt fashion',
  womensDenims: 'womens denim jeans',
  womensTrousers: 'womens trousers fashion',
  womenShoes: 'womens high heel shoes',
  womensBags: 'womens leather handbag',
  bagsTravel: 'leather travel duffel bag',
  bagsTotes: 'canvas tote bag',
  bagsBackpacks: 'leather backpack',
  watches: 'luxury wristwatch',
  noirSeries: 'black evening gown',
  limitedEdition: 'designer fashion accessory',
  summerCollection: 'linen summer clothing',
};

function search(q) {
  return new Promise((resolve) => {
    const url = 'https://api.openverse.org/v1/images/?q=' + encodeURIComponent(q) + '&page_size=15&license_type=commercial&mature=false';
    https.get(url, { headers: { 'User-Agent': 'MurgdurSeedScript/1.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const d = JSON.parse(data);
          const urls = (d.results || [])
            .filter(r => r.width >= 600 && r.height >= 600)
            .map(r => r.url);
          resolve(urls);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const results = {};
  for (const [key, q] of Object.entries(queries)) {
    const urls = await search(q);
    results[key] = urls;
    console.error(key, '->', urls.length, 'results');
    await sleep(800);
  }
  fs.writeFileSync('backend/scripts/image-search-results.json', JSON.stringify(results, null, 2));
})();
