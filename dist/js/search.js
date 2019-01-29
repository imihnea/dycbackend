/* global instantsearch algoliasearch */
var search = instantsearch({
  indexName: 'instant_search',
<<<<<<< HEAD
  // searchClient: algoliasearch('XILOZELVR5', 'd0413f1b299d094d3c09a326456d1ee2'),
  searchClient: algoliasearch('DGT3ES35E2', '8802424e32923b175631b3a21ffbb33f'),
=======
  searchClient: algoliasearch('XILOZELVR5', 'd0413f1b299d094d3c09a326456d1ee2'),
  // searchClient: algoliasearch('DGT3ES35E2', '8802424e32923b175631b3a21ffbb33f'),
>>>>>>> 60776740a85a2c2a6658d4c0f5b12c9c5c1a05ff
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
  isFirstRender
) {
  var widgetParams = renderOptions.widgetParams;

  if (isFirstRender) {
    document.querySelector(widgetParams.container).innerHTML =
      '<div class="input-group">' +
      '<input type="search" autocomplete="off" class="form-control" id="q" placeholder="' +
      widgetParams.placeholder +
      '" />' +
      '<span class="input-group-btn">' +
      '<button class="btn btn-default"><i class="fa fa-search"></button>' +
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
    placeholder: 'Search a product',
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
  '<article class="hit">' +
  '<div class="product-picture-wrapper">' +
  '<div class="product-picture"><img src="{{image}}" /></div>' +
  '</div>' +
  '<div class="product-desc-wrapper">' +
  '<div class="product-name">{{#helpers.highlight}}{ "attribute": "name" }{{/helpers.highlight}}</div>' +
  '<div class="product-type">{{#helpers.highlight}}{ "attribute": "type" }{{/helpers.highlight}}</div>' +
  '<div class="ais-RatingMenu-link">{{#stars}}<svg class="starIcon ais-RatingMenu-starIcon ais-RatingMenu-starIcon{{#.}}--full{{/.}}{{^.}}--empty{{/.}}" aria-hidden="true" width="18" height="18"><use xlink:href="#ais-RatingMenu-{{#.}}starSymbol{{/.}}{{^.}}starEmptySymbol{{/.}}"></use></svg>{{/stars}}</div>' +
  '<div class="product-price">${{price}}</div>' +
  '</div>' +
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