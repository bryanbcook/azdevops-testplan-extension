namespace NUnitExample.Attachments
{
  public class Tests
  {
    #region Attachments
    [Test]
    [Property("TestCaseId", "4843")]
    public void NUnit_SingleAttachment()
    {
      var fileName = "test.txt";
      Console.WriteLine("Working directory: " + TestContext.CurrentContext.WorkDirectory);
      File.WriteAllText(fileName, "Hello, World!");
      TestContext.AddTestAttachment(fileName);
    }

    [Test]
    [Property("TestCaseId", "4844")]
    public void NUnit_MultipleAttachments()
    {
      var fileName1 = "Attachment-4844-1.txt";
      var fileName2 = "Attachment-4844-2.txt";
      File.WriteAllText(fileName1, "Attachment 1");
      File.WriteAllText(fileName2, "Attachment 2");
      TestContext.AddTestAttachment(fileName1);
      TestContext.AddTestAttachment(fileName2);
    }

    [Test]
    [Property("TestCaseId", "4845")]
    public void NUnit_AttachmentsWithDescription()
    {
      var fileName = "Attachment-4845.txt";
      File.WriteAllText(fileName, "Hello, World!");
      TestContext.AddTestAttachment(fileName, "Test Case 4845");
    }
    #endregion
  }
}