import { inputClass, labelClass } from "@/lib/ui";

export function PersonalDataForm({ name }: { name: string }) {
  return (
    <form className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="personalName" className={labelClass}>
            Имя и фамилия
          </label>
          <input
            id="personalName"
            name="personalName"
            type="text"
            defaultValue={name}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="personalPhone" className={labelClass}>
            Телефон
          </label>
          <input
            id="personalPhone"
            name="personalPhone"
            type="tel"
            autoComplete="tel"
            placeholder="+7 999 000-00-00"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="personalCity" className={labelClass}>
          Город
        </label>
        <input
          id="personalCity"
          name="personalCity"
          type="text"
          autoComplete="address-level2"
          placeholder="Укажите город"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="personalAbout" className={labelClass}>
          О себе
        </label>
        <textarea
          id="personalAbout"
          name="personalAbout"
          rows={3}
          placeholder="Несколько слов о себе"
          className={inputClass}
        />
      </div>

      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-md bg-accent px-4 py-2 font-medium text-white opacity-60"
      >
        Сохранить
      </button>
      <p className="text-center text-xs text-muted">
        Сохранение личных данных подключим позже
      </p>
    </form>
  );
}
