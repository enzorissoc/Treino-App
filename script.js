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

  row.innerHTML =
    '<input type="checkbox"' + (checked ? ' checked' : '') + '>' +
    '<div class="exercise-info">' +
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

function init() {
  var exercises = loadExercises();
  var list = document.getElementById('exercise-list');

  exercises.forEach(function(ex) {
    list.appendChild(createExerciseRow(ex.name, ex.series, ex.reps, ex.checked));
  });

  document.getElementById('btn-add').addEventListener('click', addExercise);
  document.getElementById('btn-clear').addEventListener('click', clearExercises);

  preventZoom();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  }
}

document.addEventListener('DOMContentLoaded', init);
