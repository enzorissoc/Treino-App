function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getTreinoId() {
  var path = window.location.pathname;
  var file = path.split('/').pop();
  return file.replace('.html', '');
}

function getStorageKey() {
  return 'treino_' + getTreinoId();
}

function loadExercises() {
  var data = localStorage.getItem(getStorageKey());
  return data ? JSON.parse(data) : [];
}

function saveExercises() {
  var list = document.getElementById('exercise-list');
  var items = [];
  list.querySelectorAll(':scope > .exercise-row, :scope > .biset-group').forEach(function(el) {
    if (el.classList.contains('biset-group')) {
      var rows = el.querySelectorAll('.exercise-row');
      var exs = [];
      rows.forEach(function(r) {
        exs.push({
          name: r.dataset.name,
          series: r.dataset.series,
          reps: r.dataset.reps,
          rest: r.dataset.rest,
          notes: r.dataset.notes,
          checked: r.dataset.checked === 'true'
        });
      });
      items.push({ type: 'biset', exercises: exs });
    } else {
      items.push({
        type: 'simple',
        name: el.dataset.name,
        series: el.dataset.series,
        reps: el.dataset.reps,
        rest: el.dataset.rest,
        notes: el.dataset.notes,
        checked: el.dataset.checked === 'true'
      });
    }
  });
  localStorage.setItem(getStorageKey(), JSON.stringify(items));
}

function createExerciseRow(name, series, reps, rest, notes, checked) {
  var row = document.createElement('div');
  row.className = 'exercise-row' + (checked ? ' checked' : '');
  row.dataset.name = name || '';
  row.dataset.series = series || '';
  row.dataset.reps = reps || '';
  row.dataset.rest = rest || '';
  row.dataset.notes = notes || '';
  row.dataset.checked = checked ? 'true' : '';
  row.draggable = true;

  row.innerHTML =
    '<span class="drag-handle">☰</span>' +
    '<button class="exercise-check" onclick="event.stopPropagation();toggleExercise(this)">' +
      '<svg viewBox="0 0 24 24"><polyline points="4 12 10 18 20 6"/></svg>' +
    '</button>' +
    '<span class="exercise-number">1</span>' +
    '<div class="exercise-info" onclick="editExercise(this.parentElement)">' +
      '<div class="exercise-info-top">' +
        '<span class="exercise-name">' + escapeHtml(name || 'Sem nome') + '</span>' +
        '<div class="exercise-details">' +
          '<span class="exercise-detail">' + escapeHtml(series || '0') + 'x' + escapeHtml(reps || '0') + '</span>' +
          (rest ? '<button class="exercise-rest" onclick="event.stopPropagation();startRestTimer(this,' + parseInt(rest) + ')">⏸ ' + escapeHtml(rest) + 's</button>' : '') +
        '</div>' +
      '</div>' +
      (notes ? '<span class="exercise-notes">' + escapeHtml(notes) + '</span>' : '') +
    '</div>' +
    '<button class="btn-remove" onclick="removeExercise(this)">&times;</button>';

  return row;
}

function createBisetGroup(ex1, ex2) {
  var group = document.createElement('div');
  group.className = 'biset-group';
  group.draggable = true;

  group.innerHTML =
    '<span class="drag-handle">☰</span>' +
    '<div class="biset-content">' +
      '<div class="biset-header">Biset</div>' +
    '</div>' +
    '<button class="btn-remove" onclick="removeExercise(this)">&times;</button>';

  var row1 = createExerciseRow(ex1.name, ex1.series, ex1.reps, ex1.rest, ex1.notes, ex1.checked);
  var row2 = createExerciseRow(ex2.name, ex2.series, ex2.reps, ex2.rest, ex2.notes, ex2.checked);

  var content = group.querySelector('.biset-content');
  content.appendChild(row1);
  content.appendChild(row2);

  row1.querySelector('.exercise-info').onclick = function() { editExercise(row1); };
  row2.querySelector('.exercise-info').onclick = function() { editExercise(row2); };

  return group;
}

function renumberExercises() {
  var list = document.getElementById('exercise-list');
  var items = list.querySelectorAll(':scope > .exercise-row, :scope > .biset-group');
  items.forEach(function(el, i) {
    if (el.classList.contains('exercise-row')) {
      var num = el.querySelector('.exercise-number');
    } else {
      var num = el.querySelector('.biset-header');
    }
    if (num) num.textContent = i + 1;
  });
}

function createChoiceModal() {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal">' +
      '<h2>Tipo de exercício</h2>' +
      '<p>Como deseja adicionar?</p>' +
      '<div class="modal-actions">' +
        '<button class="modal-btn-cancel" id="modal-cancel">Cancelar</button>' +
        '<button class="modal-btn-choice" id="modal-simple">Simples</button>' +
        '<button class="modal-btn-biset" id="modal-biset">Biset</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  return new Promise(function(resolve) {
    overlay.classList.add('active');

    document.getElementById('modal-cancel').addEventListener('click', function() {
      overlay.remove();
      resolve(null);
    });

    document.getElementById('modal-simple').addEventListener('click', function() {
      overlay.remove();
      resolve('simple');
    });

    document.getElementById('modal-biset').addEventListener('click', function() {
      overlay.remove();
      resolve('biset');
    });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.remove();
        resolve(null);
      }
    });
  });
}

function createExerciseFormModal(title, confirmText) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal">' +
      '<h2>' + escapeHtml(title) + '</h2>' +
      '<div class="modal-form">' +
        '<input type="text" id="input-name" placeholder="Nome do exercício">' +
        '<div class="modal-row">' +
          '<div class="modal-field">' +
            '<label>Séries</label>' +
            '<input type="number" id="input-series" min="1" value="3">' +
          '</div>' +
          '<div class="modal-field">' +
            '<label>Repetições</label>' +
            '<input type="text" id="input-reps" placeholder="Ex: 8-12" value="10">' +
          '</div>' +
        '</div>' +
        '<div class="modal-field">' +
          '<label>Descanso (segundos)</label>' +
          '<input type="number" id="input-rest" min="0" value="60">' +
        '</div>' +
        '<div class="modal-field">' +
          '<label>Notas</label>' +
          '<textarea id="input-notes" placeholder="Ex: Foco na execução..." rows="2"></textarea>' +
        '</div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="modal-btn-cancel" id="modal-cancel">Cancelar</button>' +
        '<button class="modal-btn-confirm" id="modal-confirm">' + (confirmText || 'Próximo') + '</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  return new Promise(function(resolve) {
    overlay.classList.add('active');

    var inputName = document.getElementById('input-name');

    setTimeout(function() {
      inputName.focus();
      inputName.click();
    }, 100);

    document.getElementById('modal-cancel').addEventListener('click', function() {
      overlay.remove();
      resolve(null);
    });

    document.getElementById('modal-confirm').addEventListener('click', function() {
      var name = inputName.value.trim();
      if (!name) {
        inputName.style.borderColor = '#ff5252';
        inputName.focus();
        return;
      }
      var series = document.getElementById('input-series').value;
      var reps = document.getElementById('input-reps').value;
      var rest = document.getElementById('input-rest').value;
      var notes = document.getElementById('input-notes').value.trim();
      overlay.remove();
      resolve({
        name: name,
        series: series,
        reps: reps,
        rest: rest,
        notes: notes
      });
    });

    inputName.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('modal-confirm').click();
    });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.remove();
        resolve(null);
      }
    });
  });
}

async function addExercise() {
  var choice = await createChoiceModal();
  if (!choice) return;

  var list = document.getElementById('exercise-list');

  if (choice === 'simple') {
    var data = await createExerciseFormModal('Adicionar exercício', 'Adicionar');
    if (!data) return;
    list.appendChild(createExerciseRow(data.name, data.series, data.reps, data.rest, data.notes));
  } else {
    var data1 = await createExerciseFormModal('Exercício 1', 'Próximo');
    if (!data1) return;
    var data2 = await createExerciseFormModal('Exercício 2', 'Adicionar');
    if (!data2) return;
    list.appendChild(createBisetGroup(data1, data2));
  }

  renumberExercises();
  saveExercises();
}

function createEditModal(name, series, reps, rest, notes) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal">' +
      '<h2>Editar exercício</h2>' +
      '<div class="modal-form">' +
        '<input type="text" id="input-name" placeholder="Nome do exercício" value="' + escapeHtml(name || '') + '">' +
        '<div class="modal-row">' +
          '<div class="modal-field">' +
            '<label>Séries</label>' +
            '<input type="number" id="input-series" min="1" value="' + escapeHtml(series || '3') + '">' +
          '</div>' +
          '<div class="modal-field">' +
            '<label>Repetições</label>' +
            '<input type="text" id="input-reps" placeholder="Ex: 8-12" value="' + escapeHtml(reps || '10') + '">' +
          '</div>' +
        '</div>' +
        '<div class="modal-field">' +
          '<label>Descanso (segundos)</label>' +
          '<input type="number" id="input-rest" min="0" value="' + escapeHtml(rest || '60') + '">' +
        '</div>' +
        '<div class="modal-field">' +
          '<label>Notas</label>' +
          '<textarea id="input-notes" placeholder="Ex: Foco na execução..." rows="2">' + escapeHtml(notes || '') + '</textarea>' +
        '</div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="modal-btn-cancel" id="modal-cancel">Cancelar</button>' +
        '<button class="modal-btn-confirm" id="modal-confirm">Salvar</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  return new Promise(function(resolve) {
    overlay.classList.add('active');

    var inputName = document.getElementById('input-name');

    setTimeout(function() {
      inputName.focus();
      inputName.click();
    }, 100);

    document.getElementById('modal-cancel').addEventListener('click', function() {
      overlay.remove();
      resolve(null);
    });

    document.getElementById('modal-confirm').addEventListener('click', function() {
      var newName = inputName.value.trim();
      if (!newName) {
        inputName.style.borderColor = '#ff5252';
        inputName.focus();
        return;
      }
      var series = document.getElementById('input-series').value;
      var reps = document.getElementById('input-reps').value;
      var rest = document.getElementById('input-rest').value;
      var notes = document.getElementById('input-notes').value.trim();
      overlay.remove();
      resolve({
        name: newName,
        series: series,
        reps: reps,
        rest: rest,
        notes: notes
      });
    });

    inputName.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('modal-confirm').click();
    });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.remove();
        resolve(null);
      }
    });
  });
}

async function editExercise(row) {
  var data = await createEditModal(row.dataset.name, row.dataset.series, row.dataset.reps, row.dataset.rest, row.dataset.notes);
  if (!data) return;
  row.dataset.name = data.name;
  row.dataset.series = data.series;
  row.dataset.reps = data.reps;
  row.dataset.rest = data.rest;
  row.dataset.notes = data.notes;
  row.querySelector('.exercise-name').textContent = data.name;
  var detailsDiv = row.querySelector('.exercise-details');
  detailsDiv.innerHTML =
    '<span class="exercise-detail">' + escapeHtml(data.series) + 'x' + escapeHtml(data.reps) + '</span>' +
    (data.rest ? '<button class="exercise-rest" onclick="event.stopPropagation();startRestTimer(this,' + parseInt(data.rest) + ')">⏸ ' + escapeHtml(data.rest) + 's</button>' : '');
  var infoDiv = row.querySelector('.exercise-info');
  var oldNotes = infoDiv.querySelector('.exercise-notes');
  if (oldNotes) oldNotes.remove();
  if (data.notes) {
    var notesSpan = document.createElement('span');
    notesSpan.className = 'exercise-notes';
    notesSpan.textContent = data.notes;
    infoDiv.appendChild(notesSpan);
  }
  renumberExercises();
  saveExercises();
}

async function removeExercise(btn) {
  var confirmed = await createConfirmModal('Remover exercício?', 'Tem certeza que deseja remover?', 'Remover');
  if (!confirmed) return;
  var el = btn.closest('.exercise-row, .biset-group');
  el.remove();
  renumberExercises();
  saveExercises();
}

function toggleExercise(btn) {
  var row = btn.closest('.exercise-row');
  if (!row) return;
  var isChecked = row.dataset.checked === 'true';
  row.dataset.checked = isChecked ? '' : 'true';
  row.classList.toggle('checked', !isChecked);
  saveExercises();
}

function createConfirmModal(title, message, confirmText) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal">' +
      '<h2>' + escapeHtml(title) + '</h2>' +
      '<p>' + escapeHtml(message) + '</p>' +
      '<div class="modal-actions">' +
        '<button class="modal-btn-cancel" id="modal-cancel">Cancelar</button>' +
        '<button class="modal-btn-confirm" id="modal-confirm">' + (confirmText || 'Limpar') + '</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  return new Promise(function(resolve) {
    overlay.classList.add('active');

    document.getElementById('modal-cancel').addEventListener('click', function() {
      overlay.remove();
      resolve(false);
    });

    document.getElementById('modal-confirm').addEventListener('click', function() {
      overlay.remove();
      resolve(true);
    });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    });
  });
}

async function clearExercises() {
  var confirmed = await createConfirmModal('Limpar exercícios?', 'Todos os exercícios serão removidos.');
  if (!confirmed) return;
  document.getElementById('exercise-list').innerHTML = '';
  saveExercises();
}

function preventZoom() {
  document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
  document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
  document.addEventListener('gestureend', function(e) { e.preventDefault(); });
}

function initDragAndDrop() {
  var list = document.getElementById('exercise-list');

  function getRow(el) {
    return el ? el.closest('.exercise-row, .biset-group') : null;
  }

  function findRowByY(y) {
    var rows = list.children;
    for (var i = 0; i < rows.length; i++) {
      var rect = rows[i].getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) return rows[i];
    }
    return null;
  }

  function insertRow(dragged, target, before) {
    if (!target || target === dragged) return;
    if (before) {
      list.insertBefore(dragged, target);
    } else {
      list.insertBefore(dragged, target.nextSibling);
    }
  }

  function haptic() {
    if (navigator.vibrate) navigator.vibrate(10);
  }

  // --- Desktop drag ---
  var dTarget = null;

  function dClear() {
    if (dTarget) { dTarget.classList.remove('drag-over'); dTarget = null; }
  }

  function dSet(row) {
    if (row === dTarget) return;
    dClear();
    if (row && row !== dState.row) {
      row.classList.add('drag-over');
      dTarget = row;
    }
  }

  var dState = { row: null };

  list.addEventListener('dragstart', function(e) {
    var handle = e.target.closest('.drag-handle');
    if (!handle) { e.preventDefault(); return; }
    var row = getRow(handle);
    if (!row) return;
    dState.row = row;
    row.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    haptic();
  });

  list.addEventListener('dragend', function() {
    if (dState.row) {
      dState.row.classList.remove('dragging');
      dState.row = null;
    }
    dClear();
  });

  list.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    var row = getRow(e.target) || findRowByY(e.clientY);
    dSet(row);
  });

  list.addEventListener('drop', function(e) {
    e.preventDefault();
    if (!dState.row || !dTarget) return;
    var before = e.clientY < dTarget.getBoundingClientRect().top + dTarget.offsetHeight / 2;
    insertRow(dState.row, dTarget, before);
    haptic();
    dClear();
    renumberExercises();
    saveExercises();
  });

  // --- Touch drag ---
  var t = { row: null, clone: null, startY: 0, offsetX: 0, offsetY: 0, moved: false, timer: null };
  var tTarget = null;

  function tClear() {
    if (tTarget) { tTarget.classList.remove('drag-over'); tTarget = null; }
  }

  function tSet(row) {
    if (row === tTarget) return;
    tClear();
    if (row && row !== t.row) {
      row.classList.add('drag-over');
      tTarget = row;
    }
  }

  function tMakeClone(touchY) {
    var rect = t.row.getBoundingClientRect();
    t.clone = t.row.cloneNode(true);
    t.clone.classList.add('drag-clone');
    t.clone.style.cssText =
      'width:' + rect.width + 'px;' +
      'position:fixed;' +
      'top:' + (touchY - t.offsetY) + 'px;' +
      'left:' + rect.left + 'px;' +
      'z-index:9999;' +
      'pointer-events:none;' +
      'opacity:0.92;' +
      'transform:scale(1.03);';
    document.body.appendChild(t.clone);
    t.row.classList.add('dragging');
    haptic();
  }

  list.addEventListener('touchstart', function(e) {
    var handle = e.target.closest('.drag-handle');
    if (!handle) return;
    var row = getRow(handle);
    if (!row) return;
    e.preventDefault();
    var rect = row.getBoundingClientRect();
    t.row = row;
    t.startY = e.touches[0].clientY;
    t.offsetX = e.touches[0].clientX - rect.left;
    t.offsetY = e.touches[0].clientY - rect.top;
    t.moved = false;
  }, { passive: false });

  list.addEventListener('touchmove', function(e) {
    if (!t.row) return;
    var touchY = e.touches[0].clientY;
    var dy = Math.abs(touchY - t.startY);

    if (dy > 5 && !t.moved) {
      t.moved = true;
      tMakeClone(touchY);
    }

    if (!t.moved) return;
    e.preventDefault();

    if (t.clone) {
      t.clone.style.top = (touchY - t.offsetY) + 'px';
    }

    var row = findRowByY(touchY);
    tSet(row);

    if (touchY < 60) {
      window.scrollBy(0, -8);
    } else if (touchY > window.innerHeight - 60) {
      window.scrollBy(0, 8);
    }
  }, { passive: false });

  list.addEventListener('touchend', function(e) {
    if (t.timer) { clearTimeout(t.timer); t.timer = null; }
    if (t.clone) { t.clone.remove(); t.clone = null; }

    if (t.row && t.moved && tTarget) {
      var rect = tTarget.getBoundingClientRect();
      var touchY = e.changedTouches[0].clientY;
      var before = touchY < rect.top + rect.offsetHeight / 2;
      insertRow(t.row, tTarget, before);
      haptic();
    }

    if (t.row) t.row.classList.remove('dragging');
    t.row = null;
    t.moved = false;
    tClear();
    renumberExercises();
    saveExercises();
  });
}

var restTimer = { el: null, interval: null, remaining: 0, total: 0, wakeLock: null, alarmTimeout: null };

function createTimerOverlay() {
  if (restTimer.el) return;
  var o = document.createElement('div');
  o.className = 'rest-timer-overlay';
  o.innerHTML =
    '<div class="rest-timer-wrap">' +
      '<div class="rest-timer-circle">' +
        '<svg class="rest-timer-svg" viewBox="0 0 200 200">' +
          '<circle class="rest-timer-track" cx="100" cy="100" r="90"/>' +
          '<circle class="rest-timer-progress" cx="100" cy="100" r="90"/>' +
        '</svg>' +
        '<div class="rest-timer-count" id="rest-timer-count">0</div>' +
      '</div>' +
      '<div class="rest-timer-name" id="rest-timer-name"></div>' +
      '<button class="rest-timer-cancel" id="rest-timer-cancel">Cancelar</button>' +
    '</div>';
  document.body.appendChild(o);
  restTimer.el = o;
  o.addEventListener('click', function(e) { if (e.target === o) cancelRestTimer(); });
  document.getElementById('rest-timer-cancel').addEventListener('click', cancelRestTimer);
}

function startRestTimer(btn, seconds) {
  seconds = parseInt(seconds) || 0;
  if (seconds <= 0) return;
  cancelRestTimer();

  var row = btn.closest('.exercise-row');
  var name = row ? row.dataset.name : '';

  createTimerOverlay();
  restTimer.remaining = seconds;
  restTimer.total = seconds;

  document.getElementById('rest-timer-count').textContent = seconds;
  document.getElementById('rest-timer-name').textContent = name || 'Descanso';
  setProgress(1);
  restTimer.el.classList.remove('alarm');
  restTimer.el.classList.add('active');

  requestWakeLock();
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  restTimer.interval = setInterval(function() {
    restTimer.remaining--;
    document.getElementById('rest-timer-count').textContent = restTimer.remaining;
    setProgress(restTimer.remaining / restTimer.total);
    if (restTimer.remaining <= 0) {
      clearInterval(restTimer.interval);
      restTimer.interval = null;
      triggerAlarm();
    }
  }, 1000);
}

function cancelRestTimer() {
  if (restTimer.interval) { clearInterval(restTimer.interval); restTimer.interval = null; }
  if (restTimer.alarmTimeout) { clearTimeout(restTimer.alarmTimeout); restTimer.alarmTimeout = null; }
  if (restTimer.el) restTimer.el.classList.remove('active', 'alarm');
  releaseWakeLock();
}

function setProgress(p) {
  if (!restTimer.el) return;
  var c = 2 * Math.PI * 90;
  restTimer.el.querySelector('.rest-timer-progress').style.strokeDashoffset = c * (1 - p);
}

function triggerAlarm() {
  restTimer.el.classList.add('alarm');
  playAlarmSound();
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification('Descanso acabou!', { body: 'Hora do próximo exercício', icon: 'icon-192.svg', vibrate: [200, 100, 200] }); } catch(e) {}
  }
  restTimer.alarmTimeout = setTimeout(function() { cancelRestTimer(); }, 4000);
}

function playAlarmSound() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var tones = [880, 1100, 1320, 1100, 880];
    var t = 0.12;
    var now = ctx.currentTime;
    tones.forEach(function(freq, i) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      g.gain.setValueAtTime(0.45, now + i * t);
      g.gain.exponentialRampToValueAtTime(0.01, now + i * t + t * 0.85);
      osc.start(now + i * t);
      osc.stop(now + i * t + t);
    });
    setTimeout(function() {
      var now2 = ctx.currentTime;
      tones.forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        g.gain.setValueAtTime(0.45, now2 + i * t);
        g.gain.exponentialRampToValueAtTime(0.01, now2 + i * t + t * 0.85);
        osc.start(now2 + i * t);
        osc.stop(now2 + i * t + t);
      });
    }, 600);
  } catch(e) {}
}

function requestWakeLock() {
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').then(function(lock) {
      restTimer.wakeLock = lock;
    }).catch(function() {});
  }
}

function releaseWakeLock() {
  if (restTimer.wakeLock) { restTimer.wakeLock.release(); restTimer.wakeLock = null; }
}

function init() {
  var exercises = loadExercises();
  var list = document.getElementById('exercise-list');

  if (!list) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function() {});
    }
    return;
  }

  exercises.forEach(function(ex) {
    if (ex.type === 'biset') {
      list.appendChild(createBisetGroup(ex.exercises[0], ex.exercises[1]));
    } else {
      list.appendChild(createExerciseRow(ex.name, ex.series, ex.reps, ex.rest, ex.notes, ex.checked));
    }
  });
  renumberExercises();

  document.getElementById('btn-add').addEventListener('click', addExercise);
  document.getElementById('btn-clear').addEventListener('click', clearExercises);

  initDragAndDrop();
  preventZoom();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  }
}

document.addEventListener('DOMContentLoaded', init);
