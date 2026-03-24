(function () {
  'use strict';

  // ── Pricing Data ──────────────────────────────────────────────────────
  var hardPricing = {
    hybrid:   { budget: [45, 65],   mid: [70, 95],   high: [100, 140] },
    laminate: { budget: [35, 50],   mid: [55, 75],   high: [80, 110] },
    timber:   { budget: [80, 110],  mid: [120, 160], high: [170, 250] },
    vinyl:    { budget: [35, 55],   mid: [60, 85],   high: [90, 130] }
  };

  var carpetPricing = {
    budget: [50, 70],
    mid:    [75, 110],
    high:   [120, 180]
  };

  var subTypeNames = {
    hybrid:   'Hybrid',
    laminate: 'Laminate',
    timber:   'Timber',
    vinyl:    'Vinyl (LVP)'
  };

  var rangeLabels = { budget: 'Essential', mid: 'Premium', high: 'Designer' };

  var hardFeatures = {
    hybrid: {
      budget: ['Entry-level hybrid planks', 'Standard underlay', 'Professional installation', 'Ideal for rentals & updates'],
      mid:    ['Quality branded hybrid', 'Premium underlay included', 'Professional installation', 'Water & scratch resistant'],
      high:   ['Top-tier hybrid planks', 'Premium acoustic underlay', 'Professional installation', 'Superior finish & durability']
    },
    laminate: {
      budget: ['Basic laminate planks', 'Standard underlay', 'Professional installation', 'Cost-effective solution'],
      mid:    ['Branded laminate flooring', 'Quality underlay included', 'Professional installation', 'Realistic timber look'],
      high:   ['Premium laminate planks', 'Premium underlay included', 'Professional installation', 'Enhanced wear layer']
    },
    timber: {
      budget: ['Engineered timber', 'Standard installation', 'Professional installation', 'Natural timber beauty'],
      mid:    ['Quality engineered timber', 'Premium underlay', 'Professional installation', 'Wide plank options'],
      high:   ['Premium solid/engineered timber', 'Top-tier underlay', 'Professional installation', 'Stunning grain & finish']
    },
    vinyl: {
      budget: ['Entry-level vinyl planks', 'Standard installation', 'Professional installation', 'Waterproof & durable'],
      mid:    ['Quality vinyl planks', 'Premium underlay', 'Professional installation', '100% waterproof'],
      high:   ['Premium luxury vinyl', 'Premium acoustic underlay', 'Professional installation', 'Commercial-grade durability']
    }
  };

  // ── State ─────────────────────────────────────────────────────────────
  var state = {
    currentStep: 1,
    flooringType: null,   // 'carpet' | 'hard'
    inputMode: 'direct',  // 'direct' | 'calculate'  (per panel)
    carpetInputMode: 'direct',
    hardInputMode: 'direct',
    hardSubType: 'hybrid',
    selectedRange: null,   // 'budget' | 'mid' | 'high'
    carpetRoomCount: 1,
    hardRoomCount: 1
  };

  // ── DOM Refs ──────────────────────────────────────────────────────────
  var steps      = document.querySelectorAll('.step-indicator .step');
  var panels     = [
    document.getElementById('step1'),
    document.getElementById('step2'),
    document.getElementById('step3'),
    document.getElementById('step4')
  ];

  // ── Utility ───────────────────────────────────────────────────────────
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  function formatCurrency(n) {
    return '$' + Math.round(n).toLocaleString('en-AU');
  }

  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }

  // ── Step Navigation ───────────────────────────────────────────────────
  function goToStep(n) {
    state.currentStep = n;
    panels.forEach(function (p, i) {
      if (i === n - 1) {
        show(p);
      } else {
        hide(p);
      }
    });
    // Update step indicators: all steps <= n get active
    steps.forEach(function (s) {
      var stepNum = parseInt(s.getAttribute('data-step'), 10);
      if (stepNum <= n) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
    // Scroll to top of estimator
    var section = document.querySelector('.estimator-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ── Step 1: Flooring Type ─────────────────────────────────────────────
  var typeCards = $$('.type-card');
  typeCards.forEach(function (card) {
    card.addEventListener('click', function () {
      typeCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      state.flooringType = card.getAttribute('data-type');
      // Reset selections for subsequent steps
      state.selectedRange = null;
      $('#next3').disabled = true;
      $$('.range-card').forEach(function (c) { c.classList.remove('selected'); });
      // Auto-advance to step 2 after a brief visual pause
      setTimeout(function () {
        goToStep(2);
        setupStep2();
      }, 300);
    });
  });

  // ── Step 2: Measurements ──────────────────────────────────────────────
  function setupStep2() {
    var carpetPanel = $('#carpetMeasure');
    var hardPanel   = $('#hardMeasure');
    if (state.flooringType === 'carpet') {
      show(carpetPanel);
      hide(hardPanel);
    } else {
      show(hardPanel);
      hide(carpetPanel);
    }
    validateStep2();
  }

  // Toggle between direct / calculate for each panel
  function setupToggle(panel, type) {
    var btns = $$('.toggle-btn', panel);
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var mode = btn.getAttribute('data-input');
        if (type === 'carpet') {
          state.carpetInputMode = mode;
        } else {
          state.hardInputMode = mode;
        }
        var directEl = $('#' + type + 'Direct', panel) || $(type === 'carpet' ? '#carpetDirect' : '#hardDirect');
        var calcEl   = $('#' + type + 'Calc', panel) || $(type === 'carpet' ? '#carpetCalc' : '#hardCalc');
        if (mode === 'direct') {
          show(directEl);
          hide(calcEl);
        } else {
          hide(directEl);
          show(calcEl);
        }
        validateStep2();
      });
    });
  }

  setupToggle($('#carpetMeasure'), 'carpet');
  setupToggle($('#hardMeasure'), 'hard');

  // Room management
  function createRoomEntry(index, type) {
    var div = document.createElement('div');
    div.className = 'room-entry';
    div.setAttribute('data-room', index);
    var placeholderName = type === 'carpet' ? 'e.g. Master Bedroom' : 'e.g. Living Room';
    div.innerHTML =
      '<div class="room-header">' +
        '<span class="room-label">Room ' + index + '</span>' +
        '<button class="remove-room" aria-label="Remove room">&times;</button>' +
      '</div>' +
      '<div class="room-inputs">' +
        '<div class="form-group">' +
          '<label>Room Name</label>' +
          '<input type="text" class="room-name" placeholder="' + placeholderName + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Length (m)</label>' +
          '<input type="number" class="room-length" min="0.5" max="50" step="0.1" placeholder="0.0">' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Width (m)</label>' +
          '<input type="number" class="room-width" min="0.5" max="50" step="0.1" placeholder="0.0">' +
        '</div>' +
      '</div>';
    return div;
  }

  function updateRemoveButtons(container) {
    var entries = $$('.room-entry', container);
    entries.forEach(function (entry) {
      var btn = $('.remove-room', entry);
      if (entries.length > 1) {
        show(btn);
      } else {
        hide(btn);
      }
    });
  }

  function renumberRooms(container) {
    var entries = $$('.room-entry', container);
    entries.forEach(function (entry, i) {
      entry.setAttribute('data-room', i + 1);
      var label = $('.room-label', entry);
      if (label) label.textContent = 'Room ' + (i + 1);
    });
  }

  function addRoom(type) {
    var container = type === 'carpet' ? $('#carpetRooms') : $('#hardRooms');
    var count = $$('.room-entry', container).length + 1;
    if (type === 'carpet') {
      state.carpetRoomCount = count;
    } else {
      state.hardRoomCount = count;
    }
    var entry = createRoomEntry(count, type);
    container.appendChild(entry);
    updateRemoveButtons(container);
    bindRoomEvents(container, type);
  }

  function removeRoom(entry, type) {
    var container = type === 'carpet' ? $('#carpetRooms') : $('#hardRooms');
    container.removeChild(entry);
    renumberRooms(container);
    updateRemoveButtons(container);
    if (type === 'carpet') {
      state.carpetRoomCount = $$('.room-entry', container).length;
    } else {
      state.hardRoomCount = $$('.room-entry', container).length;
    }
    recalcRooms(type);
  }

  function bindRoomEvents(container, type) {
    // Bind inputs and remove buttons
    $$('.room-entry', container).forEach(function (entry) {
      var lenInput   = $('.room-length', entry);
      var widthInput = $('.room-width', entry);
      var removeBtn  = $('.remove-room', entry);

      // Remove old listeners by cloning
      var newLen = lenInput.cloneNode(true);
      lenInput.parentNode.replaceChild(newLen, lenInput);
      var newWidth = widthInput.cloneNode(true);
      widthInput.parentNode.replaceChild(newWidth, widthInput);

      newLen.addEventListener('input', function () { recalcRooms(type); });
      newWidth.addEventListener('input', function () { recalcRooms(type); });

      // Remove button
      var newRemove = removeBtn.cloneNode(true);
      removeBtn.parentNode.replaceChild(newRemove, removeBtn);
      newRemove.addEventListener('click', function () {
        removeRoom(entry, type);
      });
    });
  }

  function recalcRooms(type) {
    var container = type === 'carpet' ? $('#carpetRooms') : $('#hardRooms');
    var entries = $$('.room-entry', container);
    var totalArea = 0;
    entries.forEach(function (entry) {
      var l = parseFloat($('.room-length', entry).value) || 0;
      var w = parseFloat($('.room-width', entry).value) || 0;
      totalArea += l * w;
    });

    if (type === 'carpet') {
      $('#carpetTotalArea').textContent = totalArea.toFixed(2) + ' m\u00B2';
      var lm = totalArea > 0 ? (totalArea / 3.66) * 1.1 : 0;
      $('#carpetCalcLm').textContent = lm.toFixed(2) + ' LM';
    } else {
      $('#hardTotalArea').textContent = totalArea.toFixed(2) + ' m\u00B2';
      var withWaste = totalArea > 0 ? totalArea * 1.1 : 0;
      $('#hardTotalWithWaste').textContent = withWaste.toFixed(2) + ' m\u00B2';
    }
    validateStep2();
  }

  // Initial binding
  bindRoomEvents($('#carpetRooms'), 'carpet');
  bindRoomEvents($('#hardRooms'), 'hard');

  $('#addCarpetRoom').addEventListener('click', function () { addRoom('carpet'); });
  $('#addHardRoom').addEventListener('click', function () { addRoom('hard'); });

  // Direct inputs
  $('#carpetLm').addEventListener('input', validateStep2);
  $('#hardM2').addEventListener('input', validateStep2);

  function getQuantity() {
    if (state.flooringType === 'carpet') {
      if (state.carpetInputMode === 'direct') {
        return parseFloat($('#carpetLm').value) || 0;
      } else {
        var txt = $('#carpetCalcLm').textContent;
        return parseFloat(txt) || 0;
      }
    } else {
      if (state.hardInputMode === 'direct') {
        return parseFloat($('#hardM2').value) || 0;
      } else {
        var txt2 = $('#hardTotalWithWaste').textContent;
        return parseFloat(txt2) || 0;
      }
    }
  }

  function validateStep2() {
    var qty = getQuantity();
    var btn = $('#next2');
    if (btn) btn.disabled = !(qty > 0);
  }

  $('#next2').addEventListener('click', function () {
    goToStep(3);
    setupStep3();
  });

  $('#back2').addEventListener('click', function () {
    goToStep(1);
    // Remove selected state from type cards so user can re-select
  });

  // ── Step 3: Product Range ─────────────────────────────────────────────
  function setupStep3() {
    state.selectedRange = null;
    $('#next3').disabled = true;
    if (state.flooringType === 'carpet') {
      show($('#carpetRanges'));
      hide($('#hardRanges'));
      // Clear selection
      $$('.range-card', $('#carpetRanges')).forEach(function (c) { c.classList.remove('selected'); });
    } else {
      hide($('#carpetRanges'));
      show($('#hardRanges'));
      populateHardRanges(state.hardSubType);
    }
  }

  // Carpet range card clicks
  $$('.range-card', $('#carpetRanges')).forEach(function (card) {
    card.addEventListener('click', function () {
      $$('.range-card', $('#carpetRanges')).forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      state.selectedRange = card.getAttribute('data-range');
      $('#next3').disabled = false;
    });
  });

  // Hard flooring sub-type selector
  $$('.sub-type-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.sub-type-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.hardSubType = btn.getAttribute('data-subtype');
      state.selectedRange = null;
      $('#next3').disabled = true;
      populateHardRanges(state.hardSubType);
    });
  });

  function populateHardRanges(subtype) {
    var grid = $('#hardRangeGrid');
    var prices = hardPricing[subtype];
    var features = hardFeatures[subtype];
    grid.innerHTML = '';

    ['budget', 'mid', 'high'].forEach(function (tier) {
      var card = document.createElement('button');
      card.className = 'range-card';
      card.setAttribute('data-range', tier);

      var tierClass = tier === 'mid' ? ' popular' : '';
      var tierLabel = tier === 'budget' ? 'Budget' : tier === 'mid' ? 'Popular Choice' : 'Luxury';
      var rangeName = rangeLabels[tier];
      var priceLow  = prices[tier][0];
      var priceHigh = prices[tier][1];
      var priceHighStr = tier === 'high' ? '$' + priceHigh + '+' : '$' + priceHigh;

      var featureItems = '';
      features[tier].forEach(function (f) {
        featureItems += '<li>' + f + '</li>';
      });

      card.innerHTML =
        '<div class="range-tier' + tierClass + '">' + tierLabel + '</div>' +
        '<h3>' + rangeName + '</h3>' +
        '<p class="range-price">$' + priceLow + ' \u2013 ' + priceHighStr + ' <span>per m\u00B2</span></p>' +
        '<ul>' + featureItems + '</ul>';

      card.addEventListener('click', function () {
        $$('.range-card', grid).forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        state.selectedRange = tier;
        $('#next3').disabled = false;
      });

      grid.appendChild(card);
    });
  }

  $('#next3').addEventListener('click', function () {
    goToStep(4);
    showResults();
  });

  $('#back3').addEventListener('click', function () {
    goToStep(2);
    setupStep2();
  });

  // ── Step 4: Results ───────────────────────────────────────────────────
  function showResults() {
    var qty = getQuantity();
    var isCarpet = state.flooringType === 'carpet';
    var range = state.selectedRange;

    // Flooring type label
    var typeLabel;
    if (isCarpet) {
      typeLabel = 'Carpet';
    } else {
      typeLabel = subTypeNames[state.hardSubType] + ' Flooring';
    }
    $('#resultType').textContent = typeLabel;

    // Range label
    $('#resultRange').textContent = rangeLabels[range];

    // Quantity label
    var unit = isCarpet ? ' LM' : ' m\u00B2';
    $('#resultQty').textContent = qty.toFixed(1) + unit;

    // Pricing
    var priceRange;
    if (isCarpet) {
      priceRange = carpetPricing[range];
    } else {
      priceRange = hardPricing[state.hardSubType][range];
    }
    var totalLow  = qty * priceRange[0];
    var totalHigh = qty * priceRange[1];
    $('#priceLow').textContent  = formatCurrency(totalLow);
    $('#priceHigh').textContent = formatCurrency(totalHigh);

    // Room breakdown
    var usedRooms = isCarpet ? state.carpetInputMode === 'calculate' : state.hardInputMode === 'calculate';
    var roomsRow = $('#resultRoomsRow');
    var breakdownEl = $('#resultBreakdown');
    breakdownEl.innerHTML = '';

    if (usedRooms) {
      var container = isCarpet ? $('#carpetRooms') : $('#hardRooms');
      var entries = $$('.room-entry', container);
      var roomNames = [];
      var breakdownHTML = '<h4>Room Breakdown</h4><div class="breakdown-table">';
      breakdownHTML += '<div class="breakdown-header">' +
        '<span>Room</span><span>Dimensions</span><span>Area</span><span>Est. Cost</span>' +
        '</div>';

      entries.forEach(function (entry) {
        var name = ($('.room-name', entry).value || $('.room-label', entry).textContent).trim();
        var l = parseFloat($('.room-length', entry).value) || 0;
        var w = parseFloat($('.room-width', entry).value) || 0;
        var area = l * w;
        if (area <= 0) return;

        roomNames.push(name);

        var roomQty, roomLow, roomHigh;
        if (isCarpet) {
          roomQty = (area / 3.66) * 1.1;
          roomLow  = roomQty * priceRange[0];
          roomHigh = roomQty * priceRange[1];
        } else {
          roomQty = area * 1.1;
          roomLow  = roomQty * priceRange[0];
          roomHigh = roomQty * priceRange[1];
        }

        breakdownHTML += '<div class="breakdown-row">' +
          '<span>' + name + '</span>' +
          '<span>' + l.toFixed(1) + ' \u00D7 ' + w.toFixed(1) + 'm</span>' +
          '<span>' + area.toFixed(1) + ' m\u00B2</span>' +
          '<span>' + formatCurrency(roomLow) + ' \u2013 ' + formatCurrency(roomHigh) + '</span>' +
          '</div>';
      });

      breakdownHTML += '</div>';

      if (roomNames.length > 0) {
        roomsRow.style.display = '';
        $('#resultRooms').textContent = roomNames.join(', ');
        breakdownEl.innerHTML = breakdownHTML;
      } else {
        roomsRow.style.display = 'none';
      }
    } else {
      roomsRow.style.display = 'none';
    }
  }

  // ── Step 4 Actions ────────────────────────────────────────────────────
  $('#contactFromEstimate').addEventListener('click', function () {
    window.location.href = 'index.html#contact';
  });

  $('#startOver').addEventListener('click', function () {
    resetEstimator();
  });

  function resetEstimator() {
    // Reset state
    state.flooringType = null;
    state.selectedRange = null;
    state.carpetInputMode = 'direct';
    state.hardInputMode = 'direct';
    state.hardSubType = 'hybrid';
    state.carpetRoomCount = 1;
    state.hardRoomCount = 1;

    // Reset type cards
    $$('.type-card').forEach(function (c) { c.classList.remove('selected'); });

    // Reset measurement toggles to direct
    $$('#carpetMeasure .toggle-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-input') === 'direct');
    });
    $$('#hardMeasure .toggle-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-input') === 'direct');
    });

    // Show direct, hide calc
    show($('#carpetDirect'));
    hide($('#carpetCalc'));
    show($('#hardDirect'));
    hide($('#hardCalc'));

    // Clear direct inputs
    $('#carpetLm').value = '';
    $('#hardM2').value = '';

    // Reset carpet rooms to single empty room
    resetRooms('carpet');
    resetRooms('hard');

    // Reset summaries
    $('#carpetTotalArea').textContent = '0.00 m\u00B2';
    $('#carpetCalcLm').textContent = '0.00 LM';
    $('#hardTotalArea').textContent = '0.00 m\u00B2';
    $('#hardTotalWithWaste').textContent = '0.00 m\u00B2';

    // Hide measure panels
    hide($('#carpetMeasure'));
    hide($('#hardMeasure'));

    // Reset range cards
    $$('.range-card').forEach(function (c) { c.classList.remove('selected'); });
    $('#next2').disabled = true;
    $('#next3').disabled = true;

    // Reset sub-type buttons
    $$('.sub-type-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-subtype') === 'hybrid');
    });
    $('#hardRangeGrid').innerHTML = '';

    // Hide range panels
    hide($('#carpetRanges'));
    hide($('#hardRanges'));

    // Reset results
    $('#resultType').textContent = '\u2014';
    $('#resultRange').textContent = '\u2014';
    $('#resultQty').textContent = '\u2014';
    $('#resultRooms').textContent = '\u2014';
    $('#resultRoomsRow').style.display = 'none';
    $('#priceLow').textContent = '$0';
    $('#priceHigh').textContent = '$0';
    $('#resultBreakdown').innerHTML = '';

    goToStep(1);
  }

  function resetRooms(type) {
    var container = type === 'carpet' ? $('#carpetRooms') : $('#hardRooms');
    var placeholder = type === 'carpet' ? 'e.g. Master Bedroom' : 'e.g. Living Room';
    container.innerHTML = '';
    var entry = createRoomEntry(1, type);
    // Hide remove button for single room
    hide($('.remove-room', entry));
    container.appendChild(entry);
    bindRoomEvents(container, type);
  }

  // ── Navbar toggle (same as main site) ─────────────────────────────────
  var navToggle = $('#navToggle');
  var navMenu   = $('#navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      navMenu.classList.toggle('open');
      navToggle.classList.toggle('active');
    });
  }

})();
