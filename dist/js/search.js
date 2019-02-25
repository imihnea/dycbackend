document.addEventListener('DOMContentLoaded', () => {
  /* global instantsearch algoliasearch */
  var search = instantsearch({
    indexName: 'instant_search',
    // searchClient: algoliasearch('XILOZELVR5', 'd0413f1b299d094d3c09a326456d1ee2'),
    searchClient: algoliasearch('DGT3ES35E2', '8802424e32923b175631b3a21ffbb33f'),
    searchFunction(helper) {
      const container = document.querySelector('#results');
      const restofpage = document.querySelector('#allpage');

      if (helper.state.query === '') {
        container.style.display = 'none';
        restofpage.style.display = '';
      } else {
        container.style.display = '';
        restofpage.style.display = 'none';
      }

      helper.search();
    },
    routing: true,
  });

  var customSearchbox = instantsearch.connectors.connectSearchBox(function(
    renderOptions,
    isFirstRender,
  ) {
    var widgetParams = renderOptions.widgetParams;

    if (isFirstRender) {
      document.querySelector(widgetParams.container).innerHTML =
        '<div class="input-group" style="display: flex;">' +
        '<input type="search" autocomplete="off" class="input form-control" id="q" placeholder="' +
        widgetParams.placeholder +
        '" />' +
        '<span class="input-group-btn">' +
        '<button class="button is-primary searchBtn"><i class="fa fa-search"></button>' +
        '</span>' +
        '</div>';

      document.querySelector('#q').addEventListener('input', function(event) {
        renderOptions.refine(event.target.value);
      });
    }
  });

  search.addWidget(
    customSearchbox({
      container: '#searchbox',
      placeholder: 'Search for a product',
      searchOnEnterKeyPressOnly: true
    })
  );

  search.addWidget(
    instantsearch.widgets.stats({
      container: '#stats',
    })
  );

  search.on('render', function() {
    $('.product-picture img').addClass('transparent');
    $('.product-picture img')
      .one('load', function() {
        $(this).removeClass('transparent');
      })
      .each(function() {
        if (this.complete) $(this).load();
      });
  });

  var hitTemplate =
    '<article class="hit columns">' +
    '<div class="column is-one-fifth product-picture-wrapper">' +
    '<div class="product-picture"><img src="{{images.0.url}}" /></div>' +
    '</div>' +
    '<div class="column prod_info product-desc-wrapper" style="text-align: left !important;">' +
    '<div class="product-name"><p class="is-5 dealname">{{name}}</p></div>' +
    '<div class="product-name"><p class="is-5">Delivery: {{#deliveryOptions.city.valid}} <i class="fas fa-city fa-2x tooltip" style="color: green;"><span class="iTooltip">Same city delivery</span></i>{{/deliveryOptions.city.valid}}{{#deliveryOptions.state.valid}} <i class="fas fa-map-marked-alt fa-2x tooltip" style="color: green;"><span class="iTooltip">Same state delivery</span></i>{{/deliveryOptions.state.valid}}{{#deliveryOptions.country.valid}} <i class="fas fa-flag fa-2x tooltip" style="color: green;"><span class="iTooltip">Same country delivery</span></i>{{/deliveryOptions.country.valid}}{{#deliveryOptions.worldwide.valid}} <i class="fas fa-globe-americas fa-2x tooltip" style="color: green;"><span class="iTooltip">Worldwide delivery</span></i>{{/deliveryOptions.worldwide.valid}}</p></div>'+
    '<div class="product-name"><p class="is-5">From: {{author.state}}, {{author.country}}</p></div>'+
    '<div class="ais-RatingMenu-link">{{#stars}}<svg class="starIcon ais-RatingMenu-starIcon ais-RatingMenu-starIcon{{#.}}--full{{/.}}{{^.}}--empty{{/.}}" aria-hidden="true" width="18" height="18"><use xlink:href="#ais-RatingMenu-{{#.}}starSymbol{{/.}}{{^.}}starEmptySymbol{{/.}}"></use></svg>{{/stars}}</div></div>' +
    '<div class="column prod_info" style="display: flex; flex-wrap: wrap; justify-content: space-evenly; position: relative; top: -1vh;">'+'{{#price.0}}<div class="product-price prices openPrices" style="display: flex; justify-content: space-evenly; width: auto !important; margin-top: 1vh !important;"><p class="price_text">{{price.0}}</p><span class="price_img" style="margin-left: 1vw;"><img src="../../dist/img/bitcoin.png"></span></div>{{/price.0}}' + 
    '{{#price.1}}<div class="product-price prices openPrices" style="display: flex; justify-content: space-evenly; width: auto !important; margin-top: 1vh !important;"><p class="price_text">{{price.1}}</p><span class="price_img" style="margin-left: 1vw;"><img src="../../dist/img/bitcoincash.png"></span></div>{{/price.1}}'+
    '{{#price.2}}<div class="product-price prices openPrices" style="display: flex; justify-content: space-evenly; width: auto !important; margin-top: 1vh !important;"><p class="price_text">{{price.2}}</p><span class="price_img" style="margin-left: 1vw;"><img src="../../dist/img/ethereum.png"></span></div>{{/price.2}}'+
    '{{#price.3}}<div class="product-price prices openPrices" style="display: flex; justify-content: space-evenly; width: auto !important; margin-top: 1vh !important;"><p class="price_text">{{price.3}}</p><span class="price_img" style="margin-left: 1vw;"><img src="../../dist/img/litecoin.png"></span></div>{{/price.3}}'+
    '{{#price.4}}<div class="product-price prices openPrices" style="display: flex; justify-content: space-evenly; width: auto !important; margin-top: 1vh !important;"><p class="price_text">{{price.4}}</p><span class="price_img" style="margin-left: 1vw;"><img src="../../dist/img/dash.png"></span></div>{{/price.4}}'+ 
    '</div>' + '</div>'+
    '</article>';

  var noResultsTemplate =
    '<div class="ais-Stats-text">No results found matching {{query}}.</div>';

  var menuTemplate =
    '<a href="javascript:void(0);" class="facet-item {{#isRefined}}active{{/isRefined}}"><span class="facet-name"><i class="fa fa-angle-right"></i> {{label}}</span class="facet-name"></a>';

  var facetTemplateCheckbox =
    '<a href="javascript:void(0);" class="facet-item">' +
    '<input type="checkbox" class="{{cssClasses.checkbox}}" value="{{label}}" {{#isRefined}}checked{{/isRefined}} />{{label}}' +
    '<span class="facet-count">({{count}})</span>' +
    '</a>';

  search.addWidget(
    instantsearch.widgets.hits({
      container: '#hits',
      hitsPerPage: 16,
      templates: {
        empty: noResultsTemplate,
        item: hitTemplate,
      },
      transformItems: function(items) {
        return items.map(function(item) {
          item.stars = [];

          for (var i = 1; i <= 5; ++i) {
            item.stars.push(i <= item.rating);
          }

          return item;
        });
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.pagination({
      container: '#pagination',
    })
  );

  search.addWidget(
    instantsearch.widgets.hierarchicalMenu({
      container: '#categories',
      attributes: [
        'hierarchicalCategories.lvl0',
        'hierarchicalCategories.lvl1',
        'hierarchicalCategories.lvl2',
      ],
      sortBy: ['name:asc'],
      templates: {
        item: menuTemplate,
      },
    })
  );

  var typeList = instantsearch.widgets.panel({
    templates: {
      header: '<h5>Type</h5>',
    },
  })(instantsearch.widgets.refinementList);

  search.addWidget(
    typeList({
      container: '#types',
      attribute: 'type',
      operator: 'or',
      limit: 5,
      templates: {
        item: facetTemplateCheckbox,
      },
    })
  );

  var brandList = instantsearch.widgets.panel({
    templates: {
      header: '<h5>Brand</h5>',
    },
  })(instantsearch.widgets.refinementList);

  search.addWidget(
    brandList({
      container: '#brands',
      attribute: 'brand',
      operator: 'or',
      limit: 5,
      searchable: true,
      templates: {
        item: facetTemplateCheckbox,
      },
    })
  );

  var ratingList = instantsearch.widgets.panel({
    templates: {
      header: '<h5>Rating</h5>',
    },
  })(instantsearch.widgets.ratingMenu);

  search.addWidget(
    ratingList({
      container: '#rating',
      attribute: 'rating',
    })
  );

  var priceInput = instantsearch.widgets.panel({
    templates: {
      header: '<h5>Price</h5>',
    },
  })(instantsearch.widgets.rangeInput);

  search.addWidget(
    priceInput({
      container: '#price',
      attribute: 'price',
    })
  );

  search.addWidget(
    instantsearch.widgets.sortBy({
      container: '#sort-by',
      items: [
        { value: 'instant_search', label: 'Featured' },
        { value: 'instant_search_price_asc', label: 'Price asc.' },
        { value: 'instant_search_price_desc', label: 'Price desc.' },
        { value: 'btcPriceDesc', label: 'Bitcoin Price desc.'},
        { value: 'btcPriceAsc', label: 'Bitcoin Price asc.'},
        { value: 'bchPriceDesc', label: 'Bitcoin Cash Price desc.'},
        { value: 'bchPriceAsc', label: 'Bitcoin Cash Price asc.'},
        { value: 'ethPriceDesc', label: 'Ethereum Price desc.'},
        { value: 'ethPriceAsc', label: 'Ethereum Price asc.'},
        { value: 'ltcPriceDesc', label: 'Litecoin Price desc.'},
        { value: 'ltcPriceAsc', label: 'Litecoin Price asc.'},
        { value: 'dashPriceDesc', label: 'DASH Price desc.'},
        { value: 'dashPriceAsc', label: 'DASH Price asc.'},
      ],
      label: 'sort by',
    })
  );

  search.addWidget(
    instantsearch.widgets.clearRefinements({
      container: '#clear-refinements',
    })
  );

  search.start();
});