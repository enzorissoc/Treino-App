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
  var rows = document.querySelectorAll('.exercise-row');
  var exercises = [];
  rows.forEach(function(row) {
    exercises.push({
      name: row.dataset.name,
      series: row.dataset.series,
      reps: row.dataset.reps,
      checked: row.querySelector('input[type="checkbox"]').checked
    });
  });
  localStorage.setItem(getStorageKey(), JSON.stringify(exercises));
}

function createExerciseRow(name, series, reps, checked) {
  var row = document.createElement('div');
  row.className = 'exercise-row';
  row.dataset.name = name || '';
  row.dataset.series = series || '';
  row.dataset.reps = reps || '';
  row.draggable = true;

  row.innerHTML =
    '<span class="drag-handle">☰</span>' +
    '<input type="checkbox"' + (checked ? ' checked' : '') + '>' +
    '<div class="exercise-info" onclick="editExercise(this.parentElement)">' +
      '<span class="exercise-name">' + (name || 'Sem nome') + '</span>' +
      '<span class="exercise-detail">' + (series || '0') + 'x' + (reps || '0') + '</span>' +
    '</div>' +
    '<button class="btn-remove" onclick="removeExercise(this)">&times;</button>';

  row.querySelector('input[type="checkbox"]').addEventListener('change', saveExercises);
  return row;
}

function createAddModal() {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal">' +
      '<h2>Adicionar exercício</h2>' +
      '<div class="modal-form">' +
        '<input type="text" id="input-name" placeholder="Nome do exercício">' +
        '<div class="modal-row">' +
          '<div class="modal-field">' +
            '<label>Séries</label>' +
            '<input type="number" id="input-series" min="1" value="3">' +
          '</div>' +
          '<div class="modal-field">' +
            '<label>Repetições</label>' +
            '<input type="number" id="input-reps" min="1" value="10">' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="modal-btn-cancel" id="modal-cancel">Cancelar</button>' +
        '<button class="modal-btn-confirm" id="modal-confirm">Adicionar</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  return new Promise(function(resolve) {
    overlay.classList.add('active');

    var inputName = document.getElementById('input-name');
    var inputSeries = document.getElementById('input-series');
    var inputReps = document.getElementById('input-reps');

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
      overlay.remove();
      resolve({ name: name, series: inputSeries.value, reps: inputReps.value });
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
  var data = await createAddModal();
  if (!data) return;
  var list = document.getElementById('exercise-list');
  list.appendChild(createExerciseRow(data.name, data.series, data.reps, false));
  saveExercises();
}

function createEditModal(name, series, reps) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal">' +
      '<h2>Editar exercício</h2>' +
      '<div class="modal-form">' +
        '<input type="text" id="input-name" placeholder="Nome do exercício" value="' + (name || '').replace(/"/g, '&quot;') + '">' +
        '<div class="modal-row">' +
          '<div class="modal-field">' +
            '<label>Séries</label>' +
            '<input type="number" id="input-series" min="1" value="' + (series || '3') + '">' +
          '</div>' +
          '<div class="modal-field">' +
            '<label>Repetições</label>' +
            '<input type="number" id="input-reps" min="1" value="' + (reps || '10') + '">' +
          '</div>' +
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
    var inputSeries = document.getElementById('input-series');
    var inputReps = document.getElementById('input-reps');

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
      overlay.remove();
      resolve({ name: newName, series: inputSeries.value, reps: inputReps.value });
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
  var data = await createEditModal(row.dataset.name, row.dataset.series, row.dataset.reps);
  if (!data) return;
  row.dataset.name = data.name;
  row.dataset.series = data.series;
  row.dataset.reps = data.reps;
  row.querySelector('.exercise-name').textContent = data.name;
  row.querySelector('.exercise-detail').textContent = data.series + 'x' + data.reps;
  saveExercises();
}

async function removeExercise(btn) {
  var confirmed = await createConfirmModal('Remover exercício?', 'Tem certeza que deseja remover?', 'Remover');
  if (!confirmed) return;
  btn.closest('.exercise-row').remove();
  saveExercises();
}

function createConfirmModal(title, message, confirmText) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal">' +
      '<h2>' + title + '</h2>' +
      '<p>' + message + '</p>' +
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

var draggedRow = null;

function initDragAndDrop() {
  var list = document.getElementById('exercise-list');

  list.addEventListener('dragstart', function(e) {
    var handle = e.target.closest('.drag-handle');
    if (!handle) {
      e.preventDefault();
      return;
    }
    draggedRow = e.target.closest('.exercise-row');
    if (!draggedRow) return;
    draggedRow.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  });

  list.addEventListener('dragend', function(e) {
    if (draggedRow) {
      draggedRow.classList.remove('dragging');
      draggedRow = null;
      saveExercises();
    }
    document.querySelectorAll('.exercise-row').forEach(function(row) {
      row.classList.remove('drag-over');
    });
  });

  list.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    var target = e.target.closest('.exercise-row');
    if (!target || target === draggedRow) return;
    document.querySelectorAll('.exercise-row').forEach(function(row) {
      row.classList.remove('drag-over');
    });
    target.classList.add('drag-over');
  });

  list.addEventListener('dragleave', function(e) {
    var target = e.target.closest('.exercise-row');
    if (target) target.classList.remove('drag-over');
  });

  list.addEventListener('drop', function(e) {
    e.preventDefault();
    var target = e.target.closest('.exercise-row');
    if (!target || target === draggedRow || !draggedRow) return;
    var rows = Array.from(list.children);
    var dragIdx = rows.indexOf(draggedRow);
    var dropIdx = rows.indexOf(target);
    if (dragIdx < dropIdx) {
      list.insertBefore(draggedRow, target.nextSibling);
    } else {
      list.insertBefore(draggedRow, target);
    }
    target.classList.remove('drag-over');
  });

  var touchDragRow = null;
  var touchClone = null;
  var touchStartY = 0;
  var touchOffsetY = 0;

  list.addEventListener('touchstart', function(e) {
    var handle = e.target.closest('.drag-handle');
    if (!handle) return;
    touchDragRow = handle.closest('.exercise-row');
    if (!touchDragRow) return;
    var rect = touchDragRow.getBoundingClientRect();
    touchStartY = e.touches[0].clientY;
    touchOffsetY = e.touches[0].clientY - rect.top;
    setTimeout(function() {
      if (!touchDragRow) return;
      touchClone = touchDragRow.cloneNode(true);
      touchClone.classList.add('drag-clone');
      touchClone.style.width = rect.width + 'px';
      touchClone.style.position = 'fixed';
      touchClone.style.top = (e.touches[0].clientY - touchOffsetY) + 'px';
      touchClone.style.left = rect.left + 'px';
      touchClone.style.zIndex = '9999';
      touchClone.style.pointerEvents = 'none';
      touchClone.style.opacity = '0.9';
      document.body.appendChild(touchClone);
      touchDragRow.classList.add('dragging');
    }, 200);
  }, { passive: true });

  list.addEventListener('touchmove', function(e) {
    if (!touchDragRow) return;
    var touchY = e.touches[0].clientY;
    if (touchClone) {
      touchClone.style.top = (touchY - touchOffsetY) + 'px';
    }
    var rows = Array.from(list.children);
    rows.forEach(function(row) {
      if (row === touchDragRow) return;
      var rect = row.getBoundingClientRect();
      var mid = rect.top + rect.height / 2;
      if (touchY > rect.top && touchY < rect.bottom) {
        row.classList.add('drag-over');
      } else {
        row.classList.remove('drag-over');
      }
    });
  }, { passive: true });

  list.addEventListener('touchend', function(e) {
    if (!touchDragRow) return;
    if (touchClone) {
      touchClone.remove();
      touchClone = null;
    }
    var touchY = e.changedTouches[0].clientY;
    var rows = Array.from(list.children);
    var dropTarget = null;
    rows.forEach(function(row) {
      if (row === touchDragRow) return;
      var rect = row.getBoundingClientRect();
      if (touchY > rect.top && touchY < rect.bottom) {
        dropTarget = row;
      }
      row.classList.remove('drag-over');
    });
    if (dropTarget) {
      var dragIdx = rows.indexOf(touchDragRow);
      var dropIdx = rows.indexOf(dropTarget);
      if (dragIdx < dropIdx) {
        list.insertBefore(touchDragRow, dropTarget.nextSibling);
      } else {
        list.insertBefore(touchDragRow, dropTarget);
      }
    }
    touchDragRow.classList.remove('dragging');
    touchDragRow = null;
    saveExercises();
  });
}

function init() {
  var exercises = loadExercises();
  var list = document.getElementById('exercise-list');

  exercises.forEach(function(ex) {
    list.appendChild(createExerciseRow(ex.name, ex.series, ex.reps, ex.checked));
  });

  document.getElementById('btn-add').addEventListener('click', addExercise);
  document.getElementById('btn-clear').addEventListener('click', clearExercises);

  initDragAndDrop();
  preventZoom();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  }
}

document.addEventListener('DOMContentLoaded', init);
