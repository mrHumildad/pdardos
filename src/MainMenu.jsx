import { useRef } from 'react'

function MainMenu({ canContinue, onNewGame, onContinue, onPlayers, onImport, onExport }) {
  const fileInput = useRef(null)

  // The picker is invisible; Import is the visible half of the same gesture.
  const pickFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file !== undefined) onImport(file)
  }

  return (
    <main className="main-menu">
      <div className="main-menu__logo-row">
        <img
          className="main-menu__logo"
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Darts"
        />
      </div>

      <button
        type="button"
        className="main-menu__button main-menu__button--new"
        onClick={onNewGame}
      >
        <span className="main-menu__label">New game</span>
      </button>

      {/* Continue is only a choice when there is a game to return to. */}
      {canContinue && (
        <button
          type="button"
          className="main-menu__button main-menu__button--continue"
          onClick={onContinue}
        >
          <span className="main-menu__label">Continue</span>
        </button>
      )}

      <button type="button" className="main-menu__button" onClick={onPlayers}>
        <span className="main-menu__label">Players</span>
      </button>

      <button
        type="button"
        className="main-menu__button main-menu__button--import"
        onClick={() => fileInput.current?.click()}
      >
        <span className="main-menu__label">Import</span>
      </button>

      <button type="button" className="main-menu__button" onClick={onExport}>
        <span className="main-menu__label">Export</span>
      </button>

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={pickFile}
      />
    </main>
  )
}

export default MainMenu
