using System;
using System.Collections.Generic;
using System.Text;

namespace JiuDiary.Models.Branch
{
    /// <summary>
    /// Выходная модель получения списка групп
    /// </summary>
    public class GetBranchesOutputModel
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;
    }
}
